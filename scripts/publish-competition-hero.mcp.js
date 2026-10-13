/* WORK functions.exec helper. No token extraction or shell Git write credentials.
   Evaluate this file, then call publishCompetitionHero(tools, manifest, message).
   The Python companion creates manifest; only manifest.files are published.
   Binary bytes stay in tool-result memory, never in model-visible base64 text.
*/
async function publishCompetitionHero(tools, manifest, message) {
  const quote = value => "'" + String(value).replace(/'/g, "'\\''") + "'";
  const unpack = result => {
    if (result.isError) throw Error(JSON.stringify(result));
    let data = result.structuredContent;
    if (!data) {
      const block = result.content?.find(x => x.type === 'text');
      if (!block) throw Error('Missing connector result');
      data = JSON.parse(block.text);
    }
    if (typeof data.content === 'string') {
      try { return JSON.parse(data.content); } catch {}
    }
    return data;
  };
  if (manifest.repository !== 'kvolleylab/kvolleylab' || manifest.branch !== 'main')
    throw Error('Repository/branch differs from the reviewed KVL target');
  if (!manifest.files.length || new Set(manifest.files.map(x => x.path)).size !== manifest.files.length)
    throw Error('Empty or duplicate publication paths');
  for (const f of manifest.files) {
    if (!/^(assets\/img\/competition-hero\/[^/]+\.webp|data\/competitions\/[a-z0-9-]+\/config\.json|scripts\/publish-competition-hero\.(py|mcp\.js)|tests\/competition-hero-preview\.html|docs\/KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK\.md|docs\/validation\/kovo-cup-hero-v02\.json)$/.test(f.path))
      throw Error('Unexpected publication path: ' + f.path);
  }
  const head = unpack(await tools.mcp__codex_apps__github_fetch({
    url: `https://api.github.com/repos/${manifest.repository}/branches/main`
  }));
  if (head.commit.sha !== manifest.baseCommit || head.commit.commit.tree.sha !== manifest.baseTree)
    throw Error('Main changed. Refresh and review; do not force or reuse a stale tree.');

  const tree_elements = [];
  for (const f of manifest.files) {
    const chunkBytes = 12288;
    const offsets = Array.from({length: Math.ceil(f.bytes / chunkBytes)}, (_, i) => i * chunkBytes);
    const reads = await Promise.allSettled(offsets.map(async offset => {
      const python = 'import base64,pathlib,sys; b=pathlib.Path(sys.argv[1]).read_bytes(); o=int(sys.argv[2]); n=int(sys.argv[3]); print(base64.b64encode(b[o:o+n]).decode())';
      const result = await tools.exec_command({
        cmd: ['python', '-c', python, f.localPath, offset, chunkBytes].map(quote).join(' '),
        max_output_tokens: 16000
      });
      if (result.exit_code !== 0) throw Error('Local read failed: ' + f.path);
      const b64 = result.output.trim();
      const expectedLength = 4 * Math.ceil(Math.min(chunkBytes, f.bytes - offset) / 3);
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64) || b64.length !== expectedLength)
        throw Error('Truncated/corrupt local byte transfer: ' + f.path);
      return b64;
    }));
    const failures = reads.filter(r => r.status === 'rejected');
    if (failures.length) throw failures[0].reason;
    const content = reads.map(r => r.value).join('');
    const blob = unpack(await tools.mcp__codex_apps__github_create_blob({
      repository_full_name: manifest.repository, encoding: 'base64', content
    }));
    const sha = blob.sha || blob.blob?.sha;
    if (sha !== f.gitBlobSha) throw Error('Git blob hash mismatch: ' + f.path);
    tree_elements.push({path: f.path, mode: '100644', type: 'blob', sha});
  }
  const tree = unpack(await tools.mcp__codex_apps__github_create_tree({
    repository_full_name: manifest.repository, base_tree_sha: manifest.baseTree, tree_elements
  }));
  const treeSha = tree.sha || tree.tree?.sha;
  if (treeSha === manifest.baseTree) return {alreadyCurrent: true, sha: manifest.baseCommit};
  const commit = unpack(await tools.mcp__codex_apps__github_create_commit({
    repository_full_name: manifest.repository, parent_sha: manifest.baseCommit,
    tree_sha: treeSha, message
  }));
  const sha = commit.sha || commit.commit?.sha;
  if (!sha) throw Error('Missing commit SHA');
  const updated = unpack(await tools.mcp__codex_apps__github_update_ref({
    repository_full_name: manifest.repository, branch_name: 'main',
    expected_sha: manifest.baseCommit, force: false, sha
  }));
  const readback = unpack(await tools.mcp__codex_apps__github_fetch({
    url: `https://api.github.com/repos/${manifest.repository}/branches/main`
  }));
  if (readback.commit.sha !== sha) throw Error('Main readback differs from published commit');
  return {sha, treeSha, paths: tree_elements.map(f => f.path), ref: updated};
}
publishCompetitionHero;
