import sys,os,pickle,time
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,os.path.dirname(__file__))
from photomatch import load,feats
listfile,cache=sys.argv[1:3]
paths=[l.rstrip("\n") for l in open(listfile) if l.strip()]
db=pickle.load(open(cache,"rb")) if os.path.exists(cache) else {}
todo=[p for p in paths if p not in db]
print("todo",len(todo),flush=True)
def work(p):
    try:
        im=load(p)
        return p,(feats(im) if im is not None else None)
    except Exception: return p,None
t=time.time();n=0
with ThreadPoolExecutor(8) as ex:
    for p,f in ex.map(work,todo):
        db[p]=f; n+=1
        if n%200==0:
            pickle.dump(db,open(cache+".tmp","wb")); os.replace(cache+".tmp",cache)
            print(f"indexed {n}/{len(todo)} ({time.time()-t:.0f}s)",flush=True)
pickle.dump(db,open(cache+".tmp","wb")); os.replace(cache+".tmp",cache)
print("DONE",n,f"{time.time()-t:.0f}s",flush=True)
