"""색인(nas-cache.pkl)에 대해 질의 이미지들을 한 번에 찾는다. FLANN 전역 색인으로 후보 20장을 뽑고 RANSAC 으로 확인."""
import sys,os,pickle,json,time
import cv2,numpy as np
sys.path.insert(0,os.path.dirname(__file__))
from photomatch import load,feats,score
cache,qlist,out=sys.argv[1:4]
db=pickle.load(open(cache,"rb"))
EXCL=os.environ.get("EXCLUDE","")
paths=[p for p,v in db.items() if v is not None and v[1] is not None and len(v[1])>=8 and not any(e and e in p for e in EXCL.split("|"))]
print("db images",len(paths),flush=True)
owner=np.concatenate([np.full(len(db[p][1]),i,dtype=np.int32) for i,p in enumerate(paths)])
alldes=np.concatenate([db[p][1] for p in paths]).astype(np.float32)
print("descriptors",alldes.shape,flush=True)
t=time.time()
cv2.setRNGSeed(0)
flann=cv2.FlannBasedMatcher(dict(algorithm=1,trees=4),dict(checks=128))
flann.add([alldes]); flann.train()
print(f"flann built {time.time()-t:.0f}s",flush=True)
res={}
for line in open(qlist):
    qp=line.strip()
    if not qp: continue
    im=load(qp,mask=True)
    if im is None: continue
    q=feats(im)
    if q[1] is None or len(q[1])<8: res[qp]=[]; continue
    # 이웃 6개가 속한 이미지마다 표를 준다. 비율 검정을 쓰면 NAS 의 연사(近似 중복) 사진들이 서로를 지워
    # 진짜 원본이 후보에서 빠진다 — 2026-09-08 KASBP 단체 셀카 3·4·5컷에서 실제로 겪었다.
    m=flann.knnMatch(q[1].astype(np.float32),k=10)
    votes={}
    for nb in m:
        seen=set()
        for a in nb:
            o=owner[a.trainIdx]
            if o in seen: continue
            seen.add(o); votes[o]=votes.get(o,0)+1
    cand=sorted(votes.items(),key=lambda kv:-kv[1])[:120]
    ranked=sorted(((score(q,db[paths[i]]),paths[i]) for i,_ in cand),reverse=True)[:5]
    res[qp]=[(int(s),p) for s,p in ranked]
    top=ranked[0] if ranked else (0,"")
    print(os.path.relpath(qp,os.path.dirname(qlist)) if False else qp.split("/")[-2]+"/"+qp.split("/")[-1], top[0], top[1].split("/")[-1] if top[1] else "-", flush=True)
json.dump(res,open(out,"w"),ensure_ascii=False,indent=1)
