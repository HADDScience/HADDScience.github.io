"""query_all 결과 → 게시글별 표(markdown) + 대조 그림(카드 | NAS 원본)."""
import json,sys,os,collections
from PIL import Image
res=json.load(open(sys.argv[1])); outdir=sys.argv[2]; os.makedirs(outdir,exist_ok=True)
NAS=os.path.expanduser("~/NAS/HADD Science/")
FOUND,MAYBE=60,30
byp=collections.defaultdict(list)
for q,r in res.items():
    pid=q.split("/")[-2]; byp[pid].append((q,r))
rows=["| 글 | 카드 | 판정 | 인라이어 | NAS 경로 |","|---|---|---|---|---|"]
stat=collections.Counter(); found_json={}
for pid in sorted(byp,reverse=True):
    tiles=[]
    for q,r in sorted(byp[pid]):
        card=q.split("/")[-1]
        s,p=(r[0] if r else (0,""))
        s2=r[1][0] if len(r)>1 else 0
        verdict="찾음" if s>=FOUND else ("유력" if (s>=15 and s>=3*max(s2,1)) else ("애매" if s>=MAYBE else "없음"))
        stat[verdict]+=1
        rel=p.replace(NAS,"") if p else ""
        if verdict!="없음": rows.append(f"| {pid} | {card} | {verdict} | {s} | `{rel}` |")
        if s>=FOUND: found_json.setdefault(pid,{})[card]={"score":s,"nas":rel}
        if verdict in ("유력","애매"):
            try:
                a=Image.open(q).convert("RGB"); a.thumbnail((300,300))
                b=Image.open(p).convert("RGB"); b.thumbnail((300,300))
                t=Image.new("RGB",(620,320),"white" if s>=FOUND else "#ffe0e0"); t.paste(a,(5,10)); t.paste(b,(315,10)); tiles.append((card,s,t))
            except Exception as e: pass
    if tiles:
        sheet=Image.new("RGB",(620,len(tiles)*340),"white")
        from PIL import ImageDraw
        d=ImageDraw.Draw(sheet)
        for i,(card,s,t) in enumerate(tiles):
            sheet.paste(t,(0,i*340)); d.text((5,i*340+322),f"{card}  {s}",fill="black")
        sheet.save(f"{outdir}/{pid}.jpg",quality=75)
open(f"{outdir}/table.md","w").write("\n".join(rows)+"\n")
json.dump(found_json,open(f"{outdir}/found.json","w"),ensure_ascii=False,indent=1)
print(dict(stat))
