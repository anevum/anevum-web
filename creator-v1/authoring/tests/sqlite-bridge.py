import sys,json,sqlite3
p=sys.argv[1]
a=json.load(sys.stdin)
conn=sqlite3.connect(p)
conn.execute('PRAGMA foreign_keys=ON')
conn.row_factory=sqlite3.Row
try:
    mode=a['mode']
    if mode=='init':
        conn.executescript(a['schema'])
        conn.executescript(a['migration'])
        result={'ok':True}
    elif mode=='all':
        cursor=conn.execute(a['sql'],a.get('params',[]))
        result={'success':True,'results':[dict(x) for x in cursor.fetchall()]}
    elif mode=='batch':
        conn.execute('BEGIN')
        rows=[]
        for q in a['statements']:
            before=conn.total_changes
            conn.execute(q['sql'],q.get('params',[]))
            rows.append({'success':True,'meta':{'changes':conn.total_changes-before,'rows_written':conn.total_changes-before}})
        conn.commit()
        result=rows
    else: raise ValueError('unsupported')
    print(json.dumps(result))
except Exception as e:
    conn.rollback()
    print(json.dumps({'error':str(e)}))
    sys.exit(1)
finally:
    conn.close()