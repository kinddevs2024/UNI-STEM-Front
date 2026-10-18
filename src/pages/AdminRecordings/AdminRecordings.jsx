import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import AnswerReview from '../../components/AnswerReview';
import '../AdminUsers/AdminUsers.css';
import './AdminRecordings.css';

const date=value=>value?new Date(value).toLocaleString():'—';
function RecordingPlayer({recording}){
  const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const open=async()=>{setBusy(true);setError('');try{const {data}=await api.post('/admin/recordings/playback',{id:recording.id});setUrl(data.url);}catch{setError('Could not open this recording.');}finally{setBusy(false);}};
  return <article className="recording-player"><h3>{recording.type==='screen'?'Screen recording':recording.type==='camera'?'Camera recording':'Combined recording'}</h3><p>{date(recording.createdAt)}</p>{url?<video key={url} controls playsInline preload="metadata" src={url} onError={()=>{setError('Video unavailable or playback link expired. Open the recording again.');setUrl('');}}/>:<button className="button-primary" onClick={open} disabled={busy}>{busy?'Opening…':'Open video'}</button>}{error&&<p role="alert" className="users-error">{error}</p>}</article>;
}

export default function AdminRecordings(){
  const [params,setParams]=useSearchParams();
  const olympiadId=params.get('olympiad'),userId=params.get('user'),title=params.get('title')||'Olympiad';
  const page=Math.max(1,Number(params.get('page'))||1);
  const scope = `${olympiadId || ''}:${userId || ''}:${page}`;
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  useEffect(()=>{let cancelled=false;setLoading(true);setError('');setData(null);api.get('/admin/recordings',{params:{olympiadId:olympiadId||undefined,userId:userId||undefined,page}}).then(response=>{if(!cancelled)setData({...response.data,_scope:scope});}).catch(e=>{if(!cancelled)setError(e.response?.data?.message||'Could not load recordings.');}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[olympiadId,userId,page,refresh]);
  const change=values=>setParams(Object.fromEntries(Object.entries(values).filter(([,v])=>v!=null)));
  return <div className="admin-users settings-page recordings-page"><div className="container"><header className="settings-header"><p className="go-account-eyebrow">ADMINISTRATION</p><h1 className="settings-title">Olympiad <em>Recordings</em></h1><p>Review camera and screen recordings alongside participant results.</p></header><nav className="recordings-breadcrumbs" aria-label="Recordings navigation"><button className="button-secondary" onClick={()=>change({})}>All olympiads</button>{olympiadId&&<button className="button-secondary" onClick={()=>change({olympiad:olympiadId,title})}>{title}</button>}{userId&&<span>{data?.user?.name||'Participant'}</span>}<button className="button-secondary" onClick={()=>setRefresh(v=>v+1)} disabled={loading}>Refresh</button></nav>
  {error&&<p role="alert" className="users-error">{error}</p>}{loading || (data && data._scope !== scope)?<p role="status">Loading recordings…</p>:data&&<>
    {!olympiadId?<><div className="recording-groups">{data.rows.map(row=><button key={row.id} className="recording-group" onClick={()=>change({olympiad:row.id,title:row.title})}><h2>{row.title}</h2><p>{row.participants} participants · {row.recordings} recordings</p><p>Latest upload: {date(row.last)}</p><strong>View participants →</strong></button>)}</div>{!data.rows.length&&<p>No olympiad recordings uploaded yet.</p>}</>:!userId?<><h2>{title}</h2><div className="users-table"><table><thead><tr><th>Participant</th><th>School</th><th>Recordings</th><th>Result</th><th>Latest upload</th><th>Review</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td>{row.name}{row.username&&<small className="recording-username">{row.username}</small>}</td><td>{row.school||'—'}</td><td>{row.recordings}</td><td>{row.result?`${row.result.score} / ${row.result.maxScore}`:'Not submitted'}</td><td>{date(row.last)}</td><td><button className="button-secondary" onClick={()=>change({olympiad:olympiadId,title,user:row.id})}>Review participant</button></td></tr>)}</tbody></table>{!data.rows.length&&<p>No participant recordings found.</p>}</div></>:<><section className="recording-summary"><h2>{data.user.name}</h2><p>{data.user.school||'School not specified'}</p><Link className="button-secondary" to={`/admin/users?user=${userId}`}>Open profile</Link>{data.result?<><h3>Result: {data.result.score} / {data.result.maxScore} ({Number(data.result.percentage||0).toFixed(1)}%)</h3><p>Completed: {date(data.result.completedAt)} · Status: {data.result.status||'Completed'}</p></>:<p>No submitted result yet. Recordings can still be reviewed.</p>}</section><div className="recording-videos">{data.recordings.map(recording=><RecordingPlayer key={recording.id} recording={recording}/>)}</div>{!data.recordings.length&&<p>No video recordings found for this participant.</p>}<AnswerReview key={`${olympiadId}-${userId}`} questions={data.result?.questionReview}/></>}
    {!userId&&<Pagination currentPage={page} totalPages={data.pagination?.pages||1} onPageChange={next=>change({olympiad:olympiadId,title:olympiadId?title:null,page:next})}/>}
  </>}</div></div>;
}
