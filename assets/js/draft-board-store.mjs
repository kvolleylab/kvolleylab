import {validate,applyCommand} from './draft-board-core.mjs';
const encode = value => {
  const bytes=new TextEncoder().encode(JSON.stringify(value,null,2)+'\n');let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
};
const decode = content => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0))));
export class DraftStore {
  #token=''; #sha=null; #actor=null; #state=null; #pending=false; #uncertain=false;
  constructor({repository,branch,path,fetcher=fetch}) {
    if(repository!=='kvolleylab/kvolleylab'||!branch||!/^data\/drafts\/\d{4}-\d{2}\/(men|women)\.json$/.test(path))throw new Error('저장 경로 설정 오류');
    this.repository=repository;this.branch=branch;this.path=path;this.fetcher=fetcher;
    this.endpoint=`https://api.github.com/repos/${repository}`;
  }
  get actor(){return this.#actor;}
  get editable(){return Boolean(this.#actor&&this.#token&&!this.#uncertain);}
  get sha(){return this.#sha;}
  get state(){return this.#state?structuredClone(this.#state):null;}
  async #request(url,options={}) {
    const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...options.headers};
    if(this.#token)headers.Authorization=`Bearer ${this.#token}`;
    const response=await this.fetcher(url,{...options,headers,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok) {
      const error=new Error(response.status===409?'다른 관리자가 먼저 수정했습니다. 최신 내용을 다시 불러온 뒤 입력해 주세요.':
        [401,403].includes(response.status)?'저장 권한이 없거나 인증이 만료되었습니다. 저장소 Contents 쓰기 권한을 확인하세요.':
        response.status===422?'저장 충돌 또는 요청 제한입니다. 최신 내용을 다시 불러오세요.':`저장소 응답 오류 (${response.status})`);
      error.status=response.status;throw error;
    }
    return response.json();
  }
  async load() {
    if(this.#pending)throw new Error('저장 중에는 다시 불러올 수 없습니다.');
    const record=await this.#request(`${this.endpoint}/contents/${this.path}?ref=${encodeURIComponent(this.branch)}`);
    const state=validate(decode(record.content));
    const [,season,division]=this.path.match(/^data\/drafts\/(\d{4}-\d{2})\/(men|women)\.json$/);
    if(state.season!==season||state.division!==(division==='men'?'M':'W'))throw new Error('저장 경로와 시즌/부문이 일치하지 않습니다.');
    this.#state=state;this.#sha=record.sha;this.#uncertain=false;return this.state;
  }
  async connect(token) {
    this.disconnect();if(!token?.trim())throw new Error('저장소 인증 토큰을 입력하세요.');this.#token=token.trim();
    try {
      const [repo,user]=await Promise.all([this.#request(this.endpoint),this.#request('https://api.github.com/user')]);
      if(!repo.permissions?.push||!user.login)throw new Error('이 저장소를 수정할 수 있는 관리자 계정이 아닙니다.');
      await this.load();this.#actor=user.login;return this.state;
    }catch(error){this.disconnect();throw error;}
  }
  disconnect(){this.#token='';this.#actor=null;}
  async save(command,expectedRevision) {
    if(!this.editable)throw new Error('저장소 관리자 인증이 필요합니다.');
    if(this.#pending)throw new Error('이전 저장이 진행 중입니다.');
    if(this.#state?.revision!==expectedRevision)throw new Error('화면의 데이터가 오래되었습니다. 다시 불러오세요.');
    const next=applyCommand(this.#state,command,{actor:this.#actor});
    this.#pending=true;
    try {
      const saved=await this.#request(`${this.endpoint}/contents/${this.path}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        message:`Update ${next.season} ${next.division} draft: ${command.type} (revision ${next.revision})`,
        branch:this.branch,sha:this.#sha,content:encode(next)
      })});
      if(!saved.content?.sha||!saved.commit?.sha)throw new Error('저장 완료 응답을 확인하지 못했습니다. 다시 불러오세요.');
      this.#sha=saved.content.sha;this.#state=next;return {state:this.state,commit:saved.commit.sha};
    }catch(error){
      // A lost response may still have committed. Never retry blindly or reuse the old SHA.
      this.#uncertain=true;
      throw error;
    }finally{this.#pending=false;}
  }
}
export async function fetchJSON(path,fetcher=fetch){
  const response=await fetcher(path,{cache:'no-store'});if(!response.ok)throw new Error(`자료를 불러오지 못했습니다 (${response.status}).`);return response.json();
}
