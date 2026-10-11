import test from "node:test";
import assert from "node:assert/strict";
import {coversPublishedRhenLesson} from "../scripts/public-lesson-route-coverage.mjs";
const app='<Route path="/products/rhen/learn/:slug" element={<CommonsV5 />} />';
const content='    slug:"market-orders-and-quotes",\n    slug:"risk-math-and-strategy-evidence",';
const route='/products/rhen/learn/market-orders-and-quotes';
test('both authored lessons are covered by the exact single-segment route',()=>{
  assert.equal(coversPublishedRhenLesson(route,app,content),true);
  assert.equal(coversPublishedRhenLesson('/products/rhen/learn/risk-math-and-strategy-evidence',app,content),true);
});
test('an unpublished lesson cannot enter the sitemap through dynamic routing',()=>{
  assert.equal(coversPublishedRhenLesson('/products/rhen/learn/not-published',app,content),false);
  assert.equal(coversPublishedRhenLesson(route,app,''),false);
});
test('the actual lesson router is required, not a broad products wildcard',()=>{
  for(const source of ['', '<Route path="/products/:slug" />','<Route path="/products/rhen/*" />'])
    assert.equal(coversPublishedRhenLesson(route,source,content),false);
});
test('nested, encoded, malformed and query-bearing paths are not public lesson records',()=>{
  for(const value of [route+'/extra',route+'/',route+'?admin=1',route+'#section','/products/rhen/learn/../private','/products/rhen/learn/%6darket-orders-and-quotes','/products/rhen/learn/Market-orders-and-quotes','/products/rhen/learn/market--orders-and-quotes','/products/rhen/learn/','/products/rhen'])
    assert.equal(coversPublishedRhenLesson(value,app,content),false,value);
});
test('invalid inputs and non-literal slug fields fail closed',()=>{
  for(const value of [null,undefined,{},42]){
    assert.equal(coversPublishedRhenLesson(value,app,content),false);
    assert.equal(coversPublishedRhenLesson(route,value,content),false);
    assert.equal(coversPublishedRhenLesson(route,app,value),false);
  }
  assert.equal(coversPublishedRhenLesson(route,app,'slug: arbitraryFunction(),'),false);
  assert.equal(coversPublishedRhenLesson(route,app,'// slug:"market-orders-and-quotes",'),false);
});
