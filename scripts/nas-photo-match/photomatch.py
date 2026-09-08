"""카드뉴스 안의 사진을 NAS 원본에서 찾는다. SIFT 특징점 + RANSAC 인라이어 수로 판정."""
import cv2, numpy as np, os, sys, json, pickle, time
MAXSIDE=800
sift=cv2.SIFT_create(nfeatures=1500)
QMASK=[None]
def photo_mask(bgr):
    """카드에서 사진일 법한 곳: 흰 바탕도, 브랜드 파랑도 아닌 픽셀. 얇은 글자는 열기 연산으로 지운다."""
    b,g,r=cv2.split(bgr.astype(np.int16))
    white=(np.minimum(np.minimum(b,g),r)>225)
    blue=(b>r+60)&(b>g+30)
    m=(~(white|blue)).astype(np.uint8)
    k=cv2.getStructuringElement(cv2.MORPH_RECT,(17,17))
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,k)
    # 사진 상자는 직사각형이다. 큰 덩어리(면적 2% 이상)의 외접 사각형을 합쳐 사진 영역으로 본다 —
    # 사진 안의 파란 발표 화면·흰 벽이 마스크에서 빠져도 상자 전체가 살아난다.
    n,lab,stats,_=cv2.connectedComponentsWithStats(m,connectivity=8)
    out=np.zeros_like(m); area=m.shape[0]*m.shape[1]
    for i in range(1,n):
        x,y,w,h,a=stats[i]
        if a>=0.02*area: out[y:y+h,x:x+w]=1
    return out
def load(path,mask=False):
    data=np.fromfile(path,dtype=np.uint8)
    bgr=cv2.imdecode(data,cv2.IMREAD_COLOR)
    if bgr is None: return None
    h,w=bgr.shape[:2]; r=MAXSIDE/max(h,w)
    if r<1: bgr=cv2.resize(bgr,(int(w*r),int(h*r)),interpolation=cv2.INTER_AREA)
    if mask: QMASK[0]=photo_mask(bgr)
    return cv2.cvtColor(bgr,cv2.COLOR_BGR2GRAY)
def feats(im):
    QAREA[0]=im.shape[0]*im.shape[1]
    kp,des=sift.detectAndCompute(im,None)
    return np.float32([k.pt for k in kp]),des
def index(paths,cache):
    db=pickle.load(open(cache,"rb")) if os.path.exists(cache) else {}
    t=time.time();n=0
    for p in paths:
        if p in db: continue
        try:
            im=load(p)
            if im is None: db[p]=None; continue
            pts,des=feats(im); db[p]=(pts,des)
        except Exception as e: db[p]=None
        n+=1
        if n%50==0:
            pickle.dump(db,open(cache,"wb")); print(f"indexed {n} ({time.time()-t:.0f}s)",file=sys.stderr)
    pickle.dump(db,open(cache,"wb")); return db
bf=cv2.BFMatcher(cv2.NORM_L2)
def score(q,d):
    if q is None or d is None or q[1] is None or d[1] is None or len(d[1])<8: return 0
    m=bf.knnMatch(q[1],d[1],k=2)
    good=[a for a,b in (x for x in m if len(x)==2) if a.distance<0.75*b.distance]
    if len(good)<12: return len(good)//4
    src=q[0][[g.queryIdx for g in good]]; dst=d[0][[g.trainIdx for g in good]]
    H,mask=cv2.findHomography(src,dst,cv2.RANSAC,5.0)
    if mask is None: return 0
    inl=src[mask.ravel()==1]
    if QMASK[0] is None: return int(mask.sum())
    # 사진 마스크 안의 인라이어만 센다 — 로고·배지·격자·글자가 맞은 것은 사진을 찾은 게 아니다.
    mk=QMASK[0]; hh,ww=mk.shape
    return int(sum(1 for x,y in inl if 0<=int(y)<hh and 0<=int(x)<ww and mk[int(y),int(x)]))
QAREA=[800*800]
if __name__=="__main__":
    listfile,cache,qdir,out=sys.argv[1:5]
    paths=[l.rstrip("\n") for l in open(listfile) if l.strip()]
    db=index(paths,cache)
    res={}
    for qf in sorted(os.listdir(qdir)):
        qp=os.path.join(qdir,qf); im=load(qp)
        if im is None: continue
        q=feats(im)
        ranked=sorted(((score(q,d),p) for p,d in db.items() if d),reverse=True)[:5]
        res[qf]=ranked; print(qf,[(s,os.path.basename(p)) for s,p in ranked[:3]])
    json.dump(res,open(out,"w"),ensure_ascii=False,indent=1)
