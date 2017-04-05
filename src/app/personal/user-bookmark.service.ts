import {Injectable} from '@angular/core';
import {Bookmark} from '../core/model/bookmark';

import {Headers, Response} from "@angular/http";

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs";
import {HttpWrapperService} from "../core/keycloak/http-wrapper.service";

@Injectable()
export class UserBookmarkService {

  private baseUrl = '';  // URL to web api
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private httpWrapper: HttpWrapperService) {
    this.baseUrl = process.env.API_URL + '/users/';
  }

  getAllBookmarks(userId:String): Observable<Response> {
    return this.httpWrapper.get(this.baseUrl + userId + '/bookmarks');
  }

  updateBookmark(bookmark:Bookmark): Observable<any> {
    return this.httpWrapper
      .put(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, JSON.stringify(bookmark), {headers: this.headers})
      .share();
  }

  delete(bookmark:Bookmark): Observable<any> {
    return this.httpWrapper
      .delete(this.baseUrl + bookmark.userId + '/bookmarks/' + bookmark._id, {headers: this.headers})
      .share();
  }

  saveBookmark(userId:string, bookmark: Bookmark): Observable<Response> {
    return this.httpWrapper
      .post(this.baseUrl + userId + '/bookmarks', JSON.stringify(bookmark))
      .share();
  }

}
