import {debounceTime, distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {PersonalCodingmarksStore} from '../../core/store/personal-codingmarks-store.service';
import {MarkdownService} from '../markdown.service';
import {KeycloakService} from 'keycloak-angular';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';
import {MatAutocompleteSelectedEvent, MatChipInputEvent} from '@angular/material';
import {Observable} from 'rxjs';
import {languages} from '../../shared/language-options';
import {tagsValidator} from '../../shared/tags-validation.directive';
import {PublicCodingmarksStore} from '../../public/bookmark/store/public-codingmarks-store.service';
import {PublicCodingmarksService} from '../../public/bookmark/public-codingmarks.service';

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-personal-codingmark.component.html',
  styleUrls: ['./create-personal-codingmark.component.scss']
})
export class CreatePersonalCodingmarkComponent implements OnInit {

  codingmarkForm: FormGroup;
  userId = null;
  existingPublicCodingmark: Bookmark;
  displayModal = 'none';
  makePublic = false;
  personalCodingmarkPresent = false;

  // chips
  selectable = true;
  removable = true;
  addOnBlur = true;

  // Enter, comma, space
  separatorKeysCodes = [ENTER, COMMA, SPACE];

  languages = languages;

  autocompleteTags = [];

  tagCtrl = new FormControl();

  filteredTags: Observable<any[]>;

  @ViewChild('tagInput') tagInput: ElementRef;

  constructor(
    private personalBookmarksStore: PersonalCodingmarksStore,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private publicCodingmarksService: PublicCodingmarksService,
    private markdownServce: MarkdownService,
    private publicCodingmarksStore: PublicCodingmarksStore
  ) {

    keycloakService.loadUserProfile().then( keycloakProfile => {
      this.userId = keycloakProfile.id;
    });

    this.autocompleteTags = personalBookmarksStore.getPersonalAutomcompleteTags()

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => {
        return tag ? this.filter(tag) : this.autocompleteTags.slice();
      })
    );
  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.codingmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      tags: this.formBuilder.array([], [tagsValidator, Validators.required]),
      publishedOn: null,
      githubURL: '',
      description: '',
      shared: false,
      language: 'en'
    });

    this.codingmarkForm.get('location').valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(), )
      .subscribe(location => {
        if (this.personalBookmarksStore.getCodingmarkByLocation(location)) {
          this.personalCodingmarkPresent = true;
        } else {
          this.personalCodingmarkPresent = false;
          this.publicCodingmarksService.getScrapingData(location).subscribe(response => {
            if (response) {
              this.codingmarkForm.get('name').patchValue(response.title, {emitEvent : false});
              this.codingmarkForm.get('description').patchValue(response.metaDescription, {emitEvent : false});
            }
          });
        }
      });
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      const tags = this.codingmarkForm.get('tags') as FormArray;
      tags.push(this.formBuilder.control(value.trim()));
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagCtrl.setValue(null);
    this.tags.markAsDirty();
  }

  remove(index: number): void {
    const tags = this.codingmarkForm.get('tags') as FormArray;

    if (index >= 0) {
      tags.removeAt(index);
    }
    this.tags.markAsDirty();
  }

  filter(name: string) {
    return this.autocompleteTags.filter(tag => tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const tags = this.codingmarkForm.get('tags') as FormArray;
    tags.push(this.formBuilder.control(event.option.viewValue));
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  saveCodingmark(model: Bookmark) {
    const newCodingmark: Bookmark = {
      name: model.name,
      location: model.location,
      language: model.language,
      tags: model.tags,
      publishedOn: model.publishedOn,
      githubURL: model.githubURL,
      description: model.description,
      descriptionHtml: this.markdownServce.toHtml(model.description),
      userId: this.userId,
      shared: model.shared,
      starredBy: [],
      lastAccessedAt: null
  };

    this.personalBookmarksStore.addCodingmark(this.userId, newCodingmark);
  }

  onClickMakePublic(checkboxValue) {
    if (checkboxValue) {
      this.makePublic = true;
      const location: string = this.codingmarkForm.controls['location'].value;
      this.publicCodingmarksService.getPublicCodingmarkByLocation(location).subscribe(response => {
        if (response) {
          console.log(response);
          this.displayModal = 'block';
          this.existingPublicCodingmark = response;
          this.codingmarkForm.patchValue({
            shared: false
          });
        }
      });
    }
  }

  onStarClick() {
    this.displayModal = 'none';
    this.makePublic = false;
    if ( this.existingPublicCodingmark.starredBy.indexOf(this.userId) === -1) {
     this.existingPublicCodingmark.starredBy.push(this.userId);
     this.updateBookmark(this.existingPublicCodingmark);
    }
  }

  private updateBookmark(bookmark: Bookmark) {
    const obs = this.publicCodingmarksService.updateCodingmark(bookmark);
    obs.subscribe(
      res => {
        this.publicCodingmarksStore.updateBookmark(bookmark);
      }
    );
  }

  onCancelClick() {
    this.displayModal = 'none';
    this.makePublic = false;
  }

  get tags() { return <FormArray>this.codingmarkForm.get('tags'); }
}


