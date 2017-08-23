/*
 Copyright 2017 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import idb from 'idb';
import IDBHelper from '../../../../lib/idb-helper.js';
import * as googleAnalytics from '../../src/index.js';
import constants from '../../src/lib/constants.js';
import {QueuePlugin} from '../../../workbox-background-sync/src/index.js';
import {Route, Router} from '../../../workbox-routing/src/index.js';
import {NetworkFirst, NetworkOnly, RequestWrapper}
    from '../../../workbox-runtime-caching/src/index.js';


const sleep = (amount) => {
  return new Promise((resolve) => {
    setTimeout(resolve, amount);
  });
};

const waitUntil = async (test) => {
  if (test() === true) {
    return Promise.resolve();
  } else {
    await sleep(100);
    return waitUntil(test);
  }
};


describe(`initialize`, function() {
  const db = new IDBHelper(constants.IDB.NAME, 1, 'QueueStore');
  const resetDb = async function() {
    try {
      const keys = await db.getAllKeys();
      return Promise.all(keys.map((key) => db.delete(key)));
    } catch(err) {
      console.error(err);
    }
  };

  beforeEach(resetDb);
  afterEach(resetDb);

  it(`should register a handler to cache the analytics.js script`, function() {
    sinon.spy(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(
          `https://${constants.URL.HOST}${constants.URL.ANALYTICS_JS_PATH}`, {
        mode: 'no-cors',
      }),
    }));

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.ok;

    NetworkFirst.prototype.handle.restore();
  });

  it(`should register GET/POST routes for for /collect`, function() {
    sinon.spy(NetworkOnly.prototype, 'handle');

    googleAnalytics.initialize();
    const payload = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${payload}`, {
        method: 'GET',
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledOnce).to.be.ok;

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: payload,
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledTwice).to.be.ok;

    NetworkOnly.prototype.handle.restore();
  });

  it(`should not alter successful hits`, async function() {
    sinon.stub(self, 'fetch');

    googleAnalytics.initialize();
    const payload = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${payload}`, {
        method: 'GET',
      }),
    }));

    expect(self.fetch.calledOnce).to.be.ok;
    expect(self.fetch.firstCall.args[0].url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}?${payload}`);

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: payload,
      }),
    }));

    expect(self.fetch.calledTwice).to.be.ok;

    const bodyText = await self.fetch.secondCall.args[0].text();
    expect(bodyText).to.equal(payload);

    self.fetch.restore();
  });

  it(`should add failed hits to a background sync queue`, async function() {
    this.timeout(60000);

    sinon.stub(self, 'fetch').rejects(Response.error());
    const pushIntoQueue = sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize();
    const payload = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${payload}`, {
        method: 'GET',
      }),
    }));


    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: payload,
      }),
    }));

    await waitUntil(() => pushIntoQueue.callCount === 2);

    await sleep(500);
    const keys = await db.getAllKeys();
    const values = await db.getAllValues();
    console.log('key/values', keys, values);

    const [queuePlugin] = pushIntoQueue.thisValues;

    expect(pushIntoQueue.args[0][0].request.url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}?${payload}`);
    expect(pushIntoQueue.args[1][0].request.url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}`);

    pushIntoQueue.restore();
    self.fetch.restore();
  });

  it(`should add the qt param to replayed hits`, async function() {
    this.timeout(60000);

    sinon.stub(self, 'fetch').rejects(Response.error());
    const pushIntoQueue = sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize();
    const payload = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'


    await sleep(1000);


    var keys = await db.getAllKeys();
    var values = await db.getAllValues();
    console.log('key/values', keys, values);


    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${payload}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: payload,
      }),
    }));


    // Wait until the failed requests are added to the queue.
    // await waitUntil(() => pushIntoQueue.thisValues.length &&
    //     pushIntoQueue.thisValues[0]._queue.queue.length == 2);

    await sleep(1000);


    var keys = await db.getAllKeys();
    var values = await db.getAllValues();
    console.log('key/values', keys, values);


    // Get a reference to the queue plugin instance.
    const [queuePlugin] = pushIntoQueue.thisValues;



    self.fetch.restore();
    sinon.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    await queuePlugin.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());
    const payloadParams = new URLSearchParams(payload);

    expect(parseInt(replayParams1.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams1.get('qt'))).to.be.below(
        constants.STOP_RETRYING_AFTER);
    expect(parseInt(replayParams2.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams2.get('qt'))).to.be.below(
        constants.STOP_RETRYING_AFTER);

    for (const [key, value] of payloadParams.entries()) {
      expect(replayParams1.get(key)).to.equal(value);
      expect(replayParams2.get(key)).to.equal(value);
    }

    pushIntoQueue.restore();
    self.fetch.restore();
  });
});
