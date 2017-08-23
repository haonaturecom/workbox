/*
 Copyright 2016 Google Inc. All Rights Reserved.
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

import constants from '../../src/lib/constants.js';

const STATIC_ASSETS_PATH = '/packages/workbox-google-analytics/test/static';
const HIT_PAYLOAD = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F'

const deleteIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(constants.IDB.NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject();
    req.onblocked = () => {
      console.error('Database deletion is blocked.');
      reject();
    };
  });
};

describe(`workbox-precaching Test Revisioned Caching`, function() {
  // beforeEach(function() {
  //   return window.goog.swUtils.cleanState().then(deleteIndexedDB);
  // });

  // after(function() {
  //   return window.goog.swUtils.cleanState().then(deleteIndexedDB);
  // });

  it(`should cache and fetch revisioned urls`, function() {
    return window.goog.swUtils
        .activateSW(`${STATIC_ASSETS_PATH}/default.js`)
        .then(async (iframe) => {

      sinon.stub(self, 'fetch').rejects(Response.error());

      try {
        await fetch(`https://${constants.URL.HOST}` +
            `${constants.URL.COLLECT_PATH}?${HIT_PAYLOAD}`, {
              method: 'GET',
            });
      } catch(err) {
        console.error(err);
      }

      debugger;

      self.fetch.restore();
    });
  });
});



/*
describe('initialize', () => {
  it('should register a route to cache the analytics.js script', async () => {
    sinon.stub(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    const response = await fetch('https://www.google-analytics.com/analytics.js', {
      mode: 'no-cors',
    });

    debugger;

    chai.assert(NetworkFirst.prototype.handle.calledOnce);

    NetworkFirst.prototype.handle.restore();
  });

  it('should register GET/POST routes for hits', () => {

  });

  // it('should not alter successful hits');

  // it('should add failed hits to a background sync queue');
});

describe('replay-queued-requests', () => {
  const constants = workbox.googleAnalytics.test.Constants;
  const enqueueRequest = workbox.googleAnalytics.test.EnqueueRequest;
  const replayRequests =
    workbox.googleAnalytics.test.ReplayQueuedRequests;
  const IDBHelper = workbox.googleAnalytics.test.IdbHelper;

  const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
     constants.IDB.STORE);

  let fetchedUrls = [];
  const urlPrefix = 'https://replay-queued-requests.com/';
  // An arbitrary, but valid, timestamp in milliseconds.
  const initialTimestamp = 1470405670000;
  // A 1000 millisecond offset.
  const timestampOffset = 1000;
  let fetchStub;

  beforeEach(function() {
    MockDate.set(initialTimestamp + timestampOffset);
    fetchedUrls = [];
    fetchStub = sinon.stub(window, 'fetch').callsFake((requestUrl) => {
      const regex = /^https:\/\/replay-queued-requests.com\//g;
      if (regex.test(requestUrl)) {
        fetchedUrls.push(requestUrl);
      }
    });
  });

  afterEach(function() {
    fetchStub.restore();
    MockDate.reset();
  });

  const testLogic = (initialUrls, expectedUrls, time, opts) => {
    return Promise.all(initialUrls.map((url) => {
      return enqueueRequest(new Request(url), time);
    }))
    .then(() => replayRequests(opts))
    .then(() => chai.expect(fetchedUrls).to.deep.equal(expectedUrls))
    .then(() => idbHelper.getAllKeys())
    .then((keys) => chai.expect(keys.length).to.equal(0));
  };

  it(`should replay queued requests`, function() {
    const urls = ['one', 'two?three=4'].map((suffix) => urlPrefix + suffix);
    const time = initialTimestamp;
    const urlsWithQt = urls.map((url) => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithQt, time);
  });

  it(`should replay queued requests with parameters overrides`, function() {
    const urls = ['one', 'two?three=4'].map((suffix) => urlPrefix + suffix);
    const time = initialTimestamp;
    const parameterOverrides = {
      three: 5,
      four: 'six',
      qt: timestampOffset,
    };
    const urlsWithParameterOverrides = urls.map((url) => {
      const newUrl = new URL(url);
      Object.keys(parameterOverrides).sort().forEach((parameter) => {
        newUrl.searchParams.set(parameter, parameterOverrides[parameter]);
      });
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithParameterOverrides, time,
      {parameterOverrides});
  });

  it(`should replay queued requests with a hit filter`, function() {
    const urls = ['one', 'two?three=4'].map((suffix) => urlPrefix + suffix);
    const time = initialTimestamp;
    const hitFilter = (searchParams) => {
      const qt = searchParams.get('qt');
      searchParams.set('cm1', qt);
    };
    const urlsWithHitFilterApplied = urls.map((url) => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      newUrl.searchParams.set('cm1', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithHitFilterApplied, time,
      {hitFilter});
  });

  it(`should not a replay queued requests when hit filter throws`, function() {
    const urls = ['one', 'two?three=4'].map((suffix) => urlPrefix + suffix);
    const time = initialTimestamp;
    const hitFilter = (searchParams) => {
      const qt = searchParams.get('qt');
      searchParams.set('cm1', qt);
      if (searchParams.get('three') === '4') {
        throw new Error('abort!');
      }
    };
    const urlsWithHitFilterApplied = urls.slice(0, 1).map((url) => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      newUrl.searchParams.set('cm1', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithHitFilterApplied, time,
      {hitFilter});
  });
});
*/
