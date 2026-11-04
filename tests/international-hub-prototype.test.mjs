import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectItems,categoryOf,displayCard,todayKST,dateSort,groupByYear,hubUrl} from '../assets/js/international-hub-model-v1.mjs';
const data=JSON.parse(readFileSync(new URL('../data/international/senior-competitions.json',import.meta.url)));
const today='2026-11-04';
test('real registry: newest three, all five, existing category counts',()=>{
 assert.deepEqual(selectItems(data,{today}).map(x=>x.id),['asian-games-men-2026','asian-games-women-2026','avc-men-continental-2026']);
 assert.equal(selectItems(data,{today,all:true}).length,5);
 for(const [category,count] of [['olympic',0],['world-championship',0],['vnl',1],['continental',2],['asian-games',2],['multi-sport',0]])assert.equal(selectItems(data,{category,today}).length,count);
 assert.equal(selectItems(data,{year:2025,today,all:true}).length,0);
});
test('KST day boundaries and active/future filtering against actual registry',()=>{
 assert.equal(todayKST(new Date('2026-11-03T15:00:00Z')),today);
 assert.equal(todayKST(new Date('2026-11-03T14:59:59Z')),'2026-11-03');
 assert.equal(selectItems(data,{today:'2026-09-20'})[0].id,'asian-games-women-2026');
 assert.equal(selectItems(data,{today:'2026-09-20'}).some(x=>x.id==='asian-games-men-2026'),false);
 assert.equal(selectItems(data,{today:'2026-09-20',all:true}).length,5);
 assert.equal(selectItems(data,{today:'2026-01-01'}).length,0);
});
test('existing detail data replaces stale in-progress index label without mutation',()=>{
 const item=data.competitions.find(x=>x.id==='asian-games-men-2026');
 const detail=JSON.parse(readFileSync(new URL('../data/competitions/asian-games-men-2026/data.json',import.meta.url)));
 assert.equal(item.card.status,'대회 진행 중');
 assert.equal(displayCard(item,detail,today).card.accentStatus,'이란 금메달 · 대회 종료');
 assert.equal(displayCard(item,null,today).card.accentStatus,'대회 종료');
 assert.equal(displayCard(item,detail,'2026-09-01').card.accentStatus,'대회 예정');
 assert.equal(item.card.status,'대회 진행 중');
});
test('date ties use startDate descending; games mapping is compatible',()=>{
 assert.ok(dateSort({id:'a',startDate:'2026-09-01',endDate:'2026-09-30'},{id:'b',startDate:'2026-09-02',endDate:'2026-09-30'})>0);
 assert.equal(categoryOf({family:'games',id:'asian-games-men-2026'}),'asian-games');
 assert.equal(categoryOf({family:'games',id:'pan-american-games'}),'multi-sport');
 assert.equal(categoryOf({family:'continental'}),'continental');
});

test('global category keeps all years, including future records, without changing home recent limit',()=>{
 // Test-only fixtures exercise years absent from the real registry; never shipped as content.
 const fixture={competitions:[
  {id:'old-vnl',family:'vnl',year:2025,startDate:'2025-06-01',endDate:'2025-08-01'},
  {id:'old-continental',family:'continental',year:2025,startDate:'2025-07-01',endDate:'2025-09-01'},
  {id:'new-vnl',family:'vnl',year:2026,startDate:'2026-06-01',endDate:'2026-08-01'},
  {id:'other-confederation',family:'continental',year:2024,startDate:'2024-06-01',endDate:'2024-08-01'}
 ]};
 const groups=groupByYear(fixture,{category:'vnl',today:'2026-01-01'});
 assert.deepEqual(groups.find(x=>x.year===2026).items.map(x=>x.id),['new-vnl']);
 assert.deepEqual(groups.find(x=>x.year===2025).items.map(x=>x.id),['old-vnl']);
 assert.equal(groups.find(x=>x.year===2024).items.length,0);
 assert.equal(groupByYear(fixture,{category:'continental'}).find(x=>x.year===2024).items[0].id,'other-confederation');
 assert.equal(groupByYear(data,{today}).find(x=>x.year===2026).items.length,3);
 assert.equal(groupByYear(data,{category:'olympic',today}).every(x=>!x.items.length),true);
});
test('category navigation is year-independent and year all-view preserves category',()=>{
 const path='/international-competitions-hub-prototype.html';
 assert.equal(hubUrl(path,{category:'vnl'}),path+'?category=vnl');
 assert.equal(hubUrl(path,{year:2026,category:'vnl',all:true}),path+'?year=2026&view=all&category=vnl');
 assert.equal(hubUrl(path,{year:2026,category:'vnl'}),path+'?year=2026&category=vnl');
 assert.equal(hubUrl(path),path);
});
