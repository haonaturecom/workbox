import * as googleAnalytics from '../../src/index.js';
import constants from '../../src/lib/constants.js';
import {QueuePlugin} from '../../../workbox-background-sync/src/index.js';
import {Route, Router} from '../../../workbox-routing/src/index.js';
import {NetworkFirst, NetworkOnly, RequestWrapper}
    from '../../../workbox-runtime-caching/src/index.js';


describe('initialize', () => {
  it('should register a handler to cache the analytics.js script', async () => {
    sinon.spy(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request('https://www.google-analytics.com/analytics.js', {
        mode: 'no-cors',
      }),
    }));

    chai.assert(NetworkFirst.prototype.handle.calledOnce);

    NetworkFirst.prototype.handle.restore();
  });

  it('should register GET/POST routes for hits', () => {

  });

  // it('should not alter successful hits');

  // it('should add failed hits to a background sync queue');
});
