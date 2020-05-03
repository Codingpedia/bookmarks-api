var express = require('express');
var router = express.Router();

const publicBookmarksSearchService = require('./public-bookmarks-search.service');
const PublicBookmarksService = require('./public-bookmarks.service');

const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 *  Returns the with query text
 */
router.get('/', async (request, response, next) => {
  const searchText = request.query.q;
  const searcMode = request.query.include;
  const sort = request.query.sort;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);

  if (searchText) {
    const bookmarks = await publicBookmarksSearchService.findPublicBookmarks(searchText, page, limit, sort, searcMode);
    response.send(bookmarks);
  } else {
    next()
  }
});

/**
 * Get Bookmark by location
 */
router.get('/', async (request, response, next) => {
  const location = request.query.location;
  if (location) {
    const bookmarksForLocation = await PublicBookmarksService.getPublicBookmarkByLocation(location);

    return response.send(bookmarksForLocation);
  } else {
    next()
  }
});

/**
 * When no filter send latest public bookmarks
 */
router.get('/', async (request, response) => {

  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await PublicBookmarksService.getLatestPublicBookmarks(page, limit);

  return response.send(bookmarks);
});

router.get('/tagged/:tag', async (request, response) => {
  const orderBy = request.query.orderBy;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await PublicBookmarksService.getBookmarksForTag(request.params.tag, orderBy, page, limit);

  return response.send(bookmarks);
});

/* GET title of bookmark given its url - might be moved to front-end */
router.get('/scrape', async function (request, response, next) {
  const location = request.query.location;
  if (location) {
    const webpageData = await PublicBookmarksService.getScrapedDataForLocation(location);

    return response.send(webpageData);
  } else {
    next();
  }
});

/**
 *  GET bookmark by id.
 *  This needs to be the last call to avoid to "tagged" and "scrape" endpoints, which throw then errors
 */

router.get('/:id', async function (request, response) {
  const bookmark = await PublicBookmarksService.getBookmarkById(request.params.id);
  response.send(bookmark);
});


module.exports = router;
