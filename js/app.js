import { createFirebaseClient } from './firebase.js';

import {
  createPerson,
  cryptoRandomId,
  FAMILY_STORAGE_KEY
} from './family-data.js';

import { parseGedcom } from './gedcom.js';

import {
  exportTreeJson,
  importTreeJson,
  readTreeData,
  writeTreeData
} from './storage.js';

const TREE_BRANCH_COLORS = [
  '#1d4ed8',
  '#047857',
  '#b45309',
  '#7e22ce',
  '#be123c',
  '#0e7490',
  '#4d7c0f',
  '#c2410c'
];

const TRANSLATIONS = {
  en: {
    appTitle: 'Family Tree',
    dashboard: 'Dashboard',
    familyTree: 'Family Tree',
    familyMembers: 'Family Members',
    timeline: 'Timeline',
    photos: 'Photos',
    settings: 'Settings',
    quickActions: 'Quick Actions',
    quickAdd: 'Add member',
    addFamilyMember: 'Add Family Member',
    export: 'Export',
    import: 'Import',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search members...',
    searchMembers: 'Search family members',
    signInGoogle: 'Sign in with Google',
    logout: 'Log out',
    familyOverview: 'Family Overview',
    welcome: 'Welcome to your family history',
    totalMembers: 'Total Members',
    generations: 'Generations',
    recentAdditions: 'Recent Additions',
    importantEvents: 'Important Events',
    familyPreview: 'Family Preview',
    viewFamilyTree: 'View Family Tree',
    recentEvents: 'Recent Events',
    interactiveRelationships: 'Family connections',
    allMembers: 'All Members',
    familyImportantDates: 'Important Family Dates',
    familyPhotos: 'Family Photos',
    dataManagement: 'Data Management',
    dataStorage: 'Data Storage',
    deleteAll: 'Delete All',
    importGedcom: 'Import GEDCOM',
    importAction: 'Import',
    gedcomPreviewTitle: 'GEDCOM Import Preview',
    gedcomPeopleHeading: 'People detected',
    gedcomRelationshipsHeading: 'Relationships detected',
    gedcomUnsupportedNotice: 'Photos, media, and unsupported GEDCOM fields will not be imported.',
    deleteAllTitle: 'Delete All Family Data?',
    deleteAllMessage: 'This will permanently delete all family members and relationships in your current family tree. This action cannot be undone. Do you want to continue?',
    deleteAllFailed: 'Family data could not be completely deleted.',
    deleteAllSuccess: 'All family members and relationships were deleted.',
    gedcomEmpty: 'The selected GEDCOM file is empty.',
    gedcomImportSuccess: 'GEDCOM import complete.',
    gedcomImportCloudFailed: 'GEDCOM records were saved on this device, but Firestore could not be updated:',
    importExport: 'Import / Export',
    profile: 'Profile',
    fullName: 'Full Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    dateOfBirth: 'Date of Birth',
    birthPlace: 'Place of Birth',
    dateOfDeath: 'Date of Death',
    deathPlace: 'Place of Death',
    occupation: 'Occupation',
    photoUrl: 'Photo URL',
    notes: 'Notes',
    nickname: 'Nickname',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    relationship: 'Relationship',
    spouse: 'Spouse',
    children: 'Children',
    child: 'Child',
    father: 'Father',
    mother: 'Mother',
    son: 'Son',
    daughter: 'Daughter',
    brother: 'Brother',
    sister: 'Sister',
    husband: 'Husband',
    wife: 'Wife',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    uncle: 'Uncle',
    aunt: 'Aunt',
    cousin: 'Cousin',
    noRelationship: 'No relationship',
    relatedMember: 'Related family member',
    downloadPdf: 'PDF',
    printTree: 'Print',
    exportPdf: 'Export PDF',
    legendTitle: 'Family branches',
    branchLabel: 'Branch',
    branchColorHint: 'Colors follow each ancestor family branch',
    pdfExportFailed: 'The PDF could not be generated. Please try again.',
    noMembers: 'No family members found',
    noEvents: 'No timeline events yet.',
    noPhotos: 'No photos have been added yet.',
    noData: 'Not provided',
    unknownOccupation: 'Occupation not provided',
    familyMember: 'Family member',
    newMember: 'New',
    birthEvent: 'was born',
    deathEvent: 'passed away',
    marriage: 'Marriage',
    born: 'Birth',
    died: 'Death',
    saveFailed: 'Could not save family data.',
    cloudSaved: 'Saved to cloud',
    loadingCloud: 'Loading family data from Firestore…',
    importFailed: 'Import failed:',
    familyHistory: 'Family History',
    closeProfile: 'Close profile',
    closeDialog: 'Close dialog',
    treeDiagram: 'Family tree diagram',
    localSaved: 'Saved on this device',
    cloudSaving: 'Saving to cloud…',
    firebaseSetup: 'Firebase configuration is incomplete. Check js/firebase-config.js.',
    authInitializing: 'Connecting to Firebase…',
    authFailed: 'Firebase authentication could not be initialized.',
    authDomainUnauthorized: 'This domain is not authorized for Firebase Authentication. Add this domain in Firebase Console under Authentication > Settings > Authorized domains:',
    cloudUnavailable: 'Firebase is not ready. Please try again shortly.',
    loginFailed: 'Google sign-in failed',
    logoutFailed: 'Sign out failed',
    chooseMember: 'Select a family member',
    addTitle: 'Add Family Member',
    editTitle: 'Edit Family Member',
    nameRequired: 'Full name is required.',
    exportDate: 'Exported',
    courtesy: 'Courtesy of Md Injamam Ul Haque',
    familyReport: 'Family Tree',
    loginNeeded: 'Sign in with Google to save privately to Firestore.',
    treeEmpty: 'Your family tree is empty. Import a GEDCOM file or add a family member to get started.',
    unknownMember: 'Unknown family member',
    relationshipLabel: 'Relationship',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    center: 'Center Tree',
    fitTree: 'Fit to Screen',
    resetView: 'Reset View',
    living: 'Living',
    deceased: 'Deceased',
    collapse: 'Collapse',
    expand: 'Expand',
    deleteConfirm: 'Delete this family member?',
    mainNavigation: 'Main navigation'
  }
};


(function () {

  const state = {
    people: [],
    relationships: [],
    selectedPersonId: null,
    activeSection: 'dashboard',
    searchTerm: '',

    firebase: null,
    user: null,

    cloudSaveQueue: Promise.resolve(),
    cloudSaveError: null,
    cloudLoadToken: 0,
    isSavingMember: false,
    isDeletingAll: false,
    pendingGedcomImport: null,

    authStatusKey: 'firebaseSetup',
    authStatusDetails: '',
    authInitialized: false,

    tree: {
      scale: 1,
      panX: 40,
      panY: 50,
      maxDepth: 3,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      lastPanX: 40,
      lastPanY: 50,
      activePointers: new Map(),
      pinch: null
    }
  };


  const dom = {};


  document.addEventListener(
    'DOMContentLoaded',
    initializeApp
  );


  function initializeApp() {
    cacheDom();
    loadInitialData();
    bindUiEvents();
    renderAll();
    initializeCloudFeatures();
    registerServiceWorker();
  }


  function cacheDom() {

    dom.navItems = [
      ...document.querySelectorAll('.nav-item')
    ];

    dom.pages = [
      ...document.querySelectorAll('.page-panel')
    ];

    dom.searchInput =
      document.getElementById('global-search');

    dom.saveBtn =
      document.getElementById('save-btn');

    dom.addMemberBtn =
      document.getElementById('add-member-btn');

    dom.quickAddBtn =
      document.getElementById('quick-add-btn');

    dom.exportBtn =
      document.getElementById('export-btn');

    dom.previewTreeBtn =
      document.getElementById('preview-tree-btn');

    dom.deleteAllBtn =
      document.getElementById('delete-all-btn');

    dom.deleteSelectedBtn =
      document.getElementById('delete-selected-btn');

    dom.deleteAllModal =
      document.getElementById('delete-all-modal');

    dom.deleteAllCancelBtn =
      document.getElementById('delete-all-cancel-btn');

    dom.deleteAllConfirmBtn =
      document.getElementById('delete-all-confirm-btn');

    dom.deleteAllError =
      document.getElementById('delete-all-error');

    dom.importBtn =
      document.getElementById('import-tree-btn');

    dom.importGedcomBtn =
      document.getElementById('import-gedcom-btn');

    dom.importGedcomFile =
      document.getElementById('import-gedcom-file');

    dom.gedcomPreviewModal =
      document.getElementById('gedcom-preview-modal');

    dom.gedcomPreviewSummary =
      document.getElementById('gedcom-preview-summary');

    dom.gedcomPreviewPeople =
      document.getElementById('gedcom-preview-people');

    dom.gedcomPreviewRelationships =
      document.getElementById('gedcom-preview-relationships');

    dom.gedcomPreviewWarnings =
      document.getElementById('gedcom-preview-warnings');

    dom.gedcomCancelBtn =
      document.getElementById('gedcom-cancel-btn');

    dom.gedcomImportConfirmBtn =
      document.getElementById('gedcom-import-confirm-btn');

    dom.exportTreeBtn =
      document.getElementById('export-tree-btn');

    dom.importFileInput =
      document.getElementById('import-file');

    dom.membersList =
      document.getElementById('members-list');

    dom.timelineList =
      document.getElementById('timeline-list');

    dom.photosGrid =
      document.getElementById('photos-grid');

    dom.familyPreview =
      document.getElementById('family-preview');

    dom.recentEvents =
      document.getElementById('recent-events');

    dom.profilePanel =
      document.getElementById('profile-panel');

    dom.profileName =
      document.getElementById('profile-name');

    dom.profileAvatar =
      document.getElementById('profile-avatar');

    dom.profileContent =
      document.getElementById('profile-content');

    dom.profileEditBtn =
      document.getElementById('profile-edit-btn');

    dom.profileAddBtn =
      document.getElementById('profile-add-btn');

    dom.profileTreeBtn =
      document.getElementById('profile-tree-btn');

    dom.profileDeleteBtn =
      document.getElementById('profile-delete-btn');

    dom.closeProfileBtn =
      document.getElementById('close-profile');

    dom.memberModal =
      document.getElementById('member-modal');

    dom.memberForm =
      document.getElementById('member-form');

    dom.memberFormError =
      document.getElementById('member-form-error');

    dom.memberModalTitle =
      document.getElementById('member-modal-title');

    dom.closeModalBtn =
      document.getElementById('close-modal-btn');

    dom.cancelBtn =
      document.getElementById('cancel-btn');

    dom.relatedPerson =
      document.getElementById('related-person');

    dom.relationshipType =
      document.getElementById('relationship-type');

    dom.fatherPerson =
      document.getElementById('father-person');

    dom.motherPerson =
      document.getElementById('mother-person');

    dom.spousePerson =
      document.getElementById('spouse-person');

    dom.childrenPerson =
      document.getElementById('children-person');

    dom.treeSvg =
      document.getElementById('family-tree-svg');

    dom.treeViewport =
      document.getElementById('family-tree-viewport');

    dom.storageStatus =
      document.getElementById('storage-status');

    dom.totalMembers =
      document.getElementById('total-members');

    dom.generationCount =
      document.getElementById('generation-count');

    dom.recentAdditions =
      document.getElementById('recent-additions');

    dom.eventCount =
      document.getElementById('event-count');

    dom.googleLoginBtn =
      document.getElementById('google-login-btn');

    dom.logoutBtn =
      document.getElementById('logout-btn');

    dom.userProfile =
      document.getElementById('user-profile');

    dom.userPhoto =
      document.getElementById('user-photo');

    dom.userName =
      document.getElementById('user-name');

    dom.authStatus =
      document.getElementById('auth-status');

    dom.downloadPdfBtn =
      document.getElementById('download-pdf-btn');

    dom.printTreeBtn =
      document.getElementById('print-tree-btn');

    dom.treeLegend =
      document.getElementById('tree-legend');
  }


  function t(key) {
    return TRANSLATIONS.en[key] || key;
  }


  function applyLanguage() {
    const language = 'en';

    document.documentElement.lang =
      language;

    document.title =
      `${t('appTitle')} — ${t('familyHistory')}`;


    document
      .querySelectorAll('[data-i18n]')
      .forEach((element) => {

        const key =
          element.dataset.i18n;

        if (
          TRANSLATIONS[language][key]
        ) {
          element.textContent =
            t(key);
        }
      });


    document
      .querySelectorAll(
        '[data-i18n-placeholder]'
      )
      .forEach((element) => {

        element.placeholder =
          t(
            element.dataset
              .i18nPlaceholder
          );
      });


    document
      .querySelectorAll(
        '[data-i18n-aria]'
      )
      .forEach((element) => {

        element.setAttribute(
          'aria-label',
          t(
            element.dataset
              .i18nAria
          )
        );
      });


    setAuthStatus(
      state.authStatusKey,
      state.authStatusDetails
    );


    if (
      dom.memberModal &&
      !dom.memberModal.classList.contains(
        'hidden'
      )
    ) {

      const editing =
        Boolean(
          document.getElementById(
            'member-id'
          )?.value
        );

      if (dom.memberModalTitle) {
        dom.memberModalTitle.textContent =
          editing
            ? t('editTitle')
            : t('addTitle');
      }
    }
  }


  function initializeCloudFeatures() {

    setAuthStatus(
      'authInitializing'
    );


    createFirebaseClient()

      .then((client) => {

        state.firebase = client;


        client.onAuthStateChanged(

          (user) => {
            void handleAuthState(
              user
            );
          },

          (error) => {

            console.error(
              'Firebase authentication state failed:',
              error
            );

            setAuthStatus(
              'authFailed',
              error.message
            );
          }
        );
      })

      .catch((error) => {

        console.error(
          'Firebase initialization failed:',
          error
        );

        state.authInitialized = true;


        setAuthStatus(
          error.message.includes(
            'configuration is incomplete'
          )
            ? 'firebaseSetup'
            : 'authFailed',
          `(${error.message})`
        );
      });
  }


  function setAuthStatus(
    key,
    details = ''
  ) {

    state.authStatusKey =
      key;

    state.authStatusDetails =
      details;


    if (dom.authStatus) {

      dom.authStatus.textContent =
        `${t(key)}${
          details
            ? ` ${details}`
            : ''
        }`;
    }
  }


  async function handleAuthState(
    user
  ) {

    const token =
      ++state.cloudLoadToken;

    const signedOut =
      Boolean(
        state.user &&
        !user
      );


    state.user = user;

    state.authInitialized =
      true;


    if (dom.googleLoginBtn) {
      dom.googleLoginBtn.hidden =
        Boolean(user);
    }

    if (dom.logoutBtn) {
      dom.logoutBtn.hidden =
        !user;
    }

    if (dom.userProfile) {
      dom.userProfile.hidden =
        !user;
    }


    if (dom.userName) {
      dom.userName.textContent =
        user
          ? (
              user.displayName ||
              user.email ||
              user.uid
            )
          : '';
    }


    if (dom.userPhoto) {

      dom.userPhoto.hidden =
        !user?.photoURL;


      if (user?.photoURL) {
        dom.userPhoto.src =
          user.photoURL;
      } else {
        dom.userPhoto.removeAttribute(
          'src'
        );
      }
    }


    if (!user) {

      setAuthStatus(
        'loginNeeded'
      );


      if (signedOut) {

        state.people = [];

        state.relationships = [];

        state.selectedPersonId =
          null;

        renderAll();
      }

      return;
    }


    const cached =
      readTreeData(
        userStorageKey(
          user.uid
        )
      );


    state.people =
      cached?.people || [];

    state.relationships =
      cached?.relationships || [];

    state.selectedPersonId =
      state.people[0]?.id ||
      null;


    renderAll();

    setAuthStatus(
      'loadingCloud'
    );


    try {

      const cloudFamily =
        await state.firebase.loadFamily(
          user.uid
        );


      if (
        token !==
        state.cloudLoadToken
      ) {
        return;
      }


      let family =
        cloudFamily;


      if (
        !family.people.length
      ) {

        family =
          cached || {
            people: [],
            relationships: []
          };


        if (
          family.people.length
        ) {

          await state.firebase.saveFamily(
            user.uid,
            family
          );
        }
      }


      state.people =
        family.people.map(
          (person) =>
            createPerson(person)
        );


      state.relationships =
        family.relationships ||
        [];


      state.selectedPersonId =
        state.people[0]?.id ||
        null;


      writeTreeData(
        {
          people:
            state.people,

          relationships:
            state.relationships
        },

        userStorageKey(
          user.uid
        )
      );


      setAuthStatus(
        'cloudSaved'
      );


      renderAll();

    } catch (error) {

      console.error(
        'Could not load family data from Firestore:',
        error
      );


      if (cached) {

        state.people =
          cached.people;

        state.relationships =
          cached.relationships ||
          [];

        state.selectedPersonId =
          state.people[0]?.id ||
          null;

        renderAll();
      }


      setAuthStatus(
        'saveFailed',
        error.message
      );
    }
  }


  async function signInWithGoogle() {

    if (!state.firebase) {

      alert(
        state.authInitialized
          ? t('cloudUnavailable')
          : t('authInitializing')
      );

      return;
    }


    try {

      await state.firebase
        .signInWithGoogle();

    } catch (error) {

      console.error(
        'Google sign-in failed:',
        error
      );

      const unauthorizedDomain =
        error?.code === 'auth/unauthorized-domain';
      const errorDetails =
        error instanceof Error
          ? error.message
          : String(error);
      const message = unauthorizedDomain
        ? `${t('authDomainUnauthorized')} ${window.location.hostname}`
        : `${t('loginFailed')}: ${errorDetails}`;

      setAuthStatus(
        unauthorizedDomain
          ? 'authDomainUnauthorized'
          : 'loginFailed',
        unauthorizedDomain
          ? window.location.hostname
          : errorDetails
      );

      alert(
        message
      );
    }
  }


  async function signOut() {

    if (!state.firebase) {
      return;
    }


    try {

      await state.cloudSaveQueue;

      await state.firebase
        .signOut();

    } catch (error) {

      console.error(
        'Google sign-out failed:',
        error
      );

      alert(
        `${t('logoutFailed')}: ${error.message}`
      );
    }
  }


  function userStorageKey(uid) {
    return `${FAMILY_STORAGE_KEY}:${uid}`;
  }


  function loadInitialData() {

    const stored =
      readTreeData();


    if (
      stored &&
      Array.isArray(
        stored.people
      ) &&
      Array.isArray(
        stored.relationships
      )
    ) {

      state.people =
        stored.people;

      state.relationships =
        stored.relationships;

    } else {
      state.people = [];
      state.relationships = [];
    }


    state.selectedPersonId =
      state.people[0]?.id ||
      null;
  }


  function bindUiEvents() {

    dom.navItems.forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            setActiveSection(
              button.dataset.section
            );
          }
        );
      }
    );


    if (dom.searchInput) {

      dom.searchInput.addEventListener(
        'input',
        (event) => {

          state.searchTerm =
            event.target.value
              .trim()
              .toLowerCase();

          renderMembers();
          renderSearchResults();
        }
      );


      dom.searchInput.addEventListener(
        'keydown',
        (event) => {

          if (
            event.key !== 'Enter'
          ) {
            return;
          }


          const firstMatch =
            getFilteredPeople()[0];


          if (firstMatch) {

            openProfile(
              firstMatch.id
            );
          }
        }
      );
    }


    if (dom.saveBtn) {
      dom.saveBtn.addEventListener(
        'click',
        saveFamilyData
      );
    }


    if (dom.addMemberBtn) {
      dom.addMemberBtn.addEventListener(
        'click',
        () =>
          openMemberModal()
      );
    }


    if (dom.quickAddBtn) {
      dom.quickAddBtn.addEventListener(
        'click',
        () =>
          openMemberModal()
      );
    }


    if (dom.previewTreeBtn) {
      dom.previewTreeBtn.addEventListener(
        'click',
        () =>
          setActiveSection(
            'tree'
          )
      );
    }


    if (dom.exportBtn) {
      dom.exportBtn.addEventListener(
        'click',
        () =>
          exportFamilyData()
      );
    }


    if (dom.deleteAllBtn) {
      dom.deleteAllBtn.addEventListener(
        'click',
        openDeleteAllConfirmation
      );
    }

    if (dom.deleteSelectedBtn) {
      dom.deleteSelectedBtn.addEventListener('click', () => {
        if (state.selectedPersonId) deletePerson(state.selectedPersonId);
      });
    }

    dom.deleteAllCancelBtn?.addEventListener('click', closeDeleteAllConfirmation);
    dom.deleteAllConfirmBtn?.addEventListener('click', deleteAllFamilyData);
    dom.gedcomCancelBtn?.addEventListener('click', cancelGedcomImport);
    dom.gedcomImportConfirmBtn?.addEventListener('click', importPendingGedcom);


    if (dom.exportTreeBtn) {
      dom.exportTreeBtn.addEventListener(
        'click',
        () =>
          exportFamilyData()
      );
    }


    if (dom.importBtn) {
      dom.importBtn.addEventListener(
        'click',
        () =>
          dom.importFileInput?.click()
      );
    }


    if (dom.importFileInput) {

      dom.importFileInput.addEventListener(
        'change',
        handleImportFile
      );
    }

    dom.importGedcomBtn?.addEventListener('click', () => dom.importGedcomFile?.click());
    dom.importGedcomFile?.addEventListener('change', handleGedcomFile);


    if (dom.googleLoginBtn) {
      dom.googleLoginBtn.addEventListener(
        'click',
        signInWithGoogle
      );
    }


    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener(
        'click',
        signOut
      );
    }


    if (dom.downloadPdfBtn) {
      dom.downloadPdfBtn.addEventListener(
        'click',
        () =>
          exportTreePdf()
      );
    }


    if (dom.printTreeBtn) {
      dom.printTreeBtn.addEventListener(
        'click',
        () =>
          openPrintableReport()
      );
    }


    if (dom.relationshipType) {

      dom.relationshipType.addEventListener(
        'change',
        updateRelatedPersonOptions
      );
    }


    if (dom.memberForm) {

      dom.memberForm.addEventListener(
        'submit',
        handleFormSubmit
      );
    }


    if (dom.closeModalBtn) {
      dom.closeModalBtn.addEventListener(
        'click',
        closeMemberModal
      );
    }


    if (dom.cancelBtn) {
      dom.cancelBtn.addEventListener(
        'click',
        closeMemberModal
      );
    }


    if (dom.closeProfileBtn) {
      dom.closeProfileBtn.addEventListener(
        'click',
        closeProfilePanel
      );
    }


    if (dom.profileEditBtn) {
      dom.profileEditBtn.addEventListener(
        'click',
        () => {

          const person =
            getPersonById(
              state.selectedPersonId
            );

          if (person) {
            openMemberModal(
              person.id
            );
          }
        }
      );
    }


    if (dom.profileAddBtn) {
      dom.profileAddBtn.addEventListener(
        'click',
        () => {

          const person =
            getPersonById(
              state.selectedPersonId
            );

          if (person) {
            openMemberModal(
              null,
              person.id
            );
          }
        }
      );
    }


    if (dom.profileTreeBtn) {
      dom.profileTreeBtn.addEventListener(
        'click',
        () => {

          setActiveSection(
            'tree'
          );

          closeProfilePanel();
        }
      );
    }


    if (dom.profileDeleteBtn) {
      dom.profileDeleteBtn.addEventListener(
        'click',
        () => {

          const person =
            getPersonById(
              state.selectedPersonId
            );

          if (person) {
            deletePerson(
              person.id
            );
          }
        }
      );
    }


    document
      .querySelectorAll(
        '.toolbar-btn'
      )
      .forEach((button) => {

        button.addEventListener(
          'click',
          () => {

            handleTreeAction(
              button.dataset.action
            );
          }
        );
      });


    if (dom.treeViewport) {

      dom.treeViewport.addEventListener(
        'wheel',
        (event) => {

          event.preventDefault();

          const delta =
            event.deltaY < 0
              ? 0.08
              : -0.08;

          changeZoom(
            state.tree.scale +
              delta
          );
        },
        {
          passive: false
        }
      );


      dom.treeViewport.addEventListener(
        'pointerdown',
        (event) => {
          const isTouch = event.pointerType === 'touch';
          if (isTouch) {
            state.tree.activePointers.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY
            });
            if (state.tree.activePointers.size === 2) {
              const points = [...state.tree.activePointers.values()];
              const centerX = (points[0].x + points[1].x) / 2;
              const centerY = (points[0].y + points[1].y) / 2;
              state.tree.pinch = {
                distance: Math.hypot(
                  points[1].x - points[0].x,
                  points[1].y - points[0].y
                ),
                scale: state.tree.scale,
                anchorX: (centerX - state.tree.panX) / state.tree.scale,
                anchorY: (centerY - state.tree.panY) / state.tree.scale
              };
              state.tree.dragging = false;
            } else if (!event.target.closest('.tree-node')) {
              state.tree.dragging = true;
              state.tree.dragStartX = event.clientX;
              state.tree.dragStartY = event.clientY;
              state.tree.lastPanX = state.tree.panX;
              state.tree.lastPanY = state.tree.panY;
            }
          } else {
            if (event.target.closest('.tree-node')) return;
            state.tree.dragging = true;
            state.tree.dragStartX = event.clientX;
            state.tree.dragStartY = event.clientY;
            state.tree.lastPanX = state.tree.panX;
            state.tree.lastPanY = state.tree.panY;
          }
          try {
            dom.treeViewport.setPointerCapture(
              event.pointerId
            );
          } catch (_) {}
        }
      );


      dom.treeViewport.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerType === 'touch' &&
              state.tree.activePointers.has(event.pointerId)) {
            state.tree.activePointers.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY
            });
            if (state.tree.activePointers.size >= 2) {
              const points = [...state.tree.activePointers.values()].slice(0, 2);
              const centerX = (points[0].x + points[1].x) / 2;
              const centerY = (points[0].y + points[1].y) / 2;
              const distance = Math.hypot(
                points[1].x - points[0].x,
                points[1].y - points[0].y
              );
              if (!state.tree.pinch) {
                state.tree.pinch = {
                  distance,
                  scale: state.tree.scale,
                  anchorX: (centerX - state.tree.panX) / state.tree.scale,
                  anchorY: (centerY - state.tree.panY) / state.tree.scale
                };
              }
              const pinch = state.tree.pinch;
              state.tree.scale = Math.min(
                2.2,
                Math.max(0.25, pinch.scale * distance / Math.max(1, pinch.distance))
              );
              state.tree.panX = centerX - pinch.anchorX * state.tree.scale;
              state.tree.panY = centerY - pinch.anchorY * state.tree.scale;
              renderFamilyTree();
              return;
            }
          }
          if (
            !state.tree.dragging
          ) {
            return;
          }


          const dx =
            event.clientX -
            state.tree.dragStartX;

          const dy =
            event.clientY -
            state.tree.dragStartY;


          state.tree.panX =
            state.tree.lastPanX +
            dx;

          state.tree.panY =
            state.tree.lastPanY +
            dy /
              state.tree.scale;


          renderFamilyTree();
        }
      );


      dom.treeViewport.addEventListener(
        'pointerup',
        (event) => {
          state.tree.activePointers.delete(event.pointerId);
          state.tree.pinch = null;
          state.tree.dragging = false;
          if (state.tree.activePointers.size === 1) {
            const [point] = state.tree.activePointers.values();
            state.tree.dragging = true;
            state.tree.dragStartX = point.x;
            state.tree.dragStartY = point.y;
            state.tree.lastPanX = state.tree.panX;
            state.tree.lastPanY = state.tree.panY;
          }
        }
      );


      dom.treeViewport.addEventListener(
        'pointercancel',
        (event) => {
          state.tree.activePointers.delete(event.pointerId);
          state.tree.pinch = null;
          state.tree.dragging = false;
        }
      );
    }
  }


  function setActiveSection(
    sectionName
  ) {

    state.activeSection =
      sectionName;


    dom.navItems.forEach(
      (button) => {

        button.classList.toggle(
          'active',
          button.dataset.section ===
            sectionName
        );
      }
    );


    dom.pages.forEach(
      (page) => {

        page.classList.toggle(
          'active',
          page.id ===
            sectionName
        );
      }
    );

    renderAll();

    if (sectionName === 'tree') {
      requestAnimationFrame(centerTree);
    }
  }


  function renderAll() {
    renderDashboard();
    renderMembers();
    renderTimeline();
    renderPhotos();
    renderFamilyTree();
    renderProfilePanel();
    renderSearchResults();
    updateStorageStatus();
    applyLanguage();
  }


  function renderDashboard() {

    const people =
      state.people;

    const total =
      people.length;

    const generationCount =
      computeGenerationCount();


    const recent =
      people
        .slice()
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        )
        .slice(0, 3);


    const events =
      buildEventList();


    if (dom.totalMembers) {
      dom.totalMembers.textContent =
        String(total);
    }

    if (dom.generationCount) {
      dom.generationCount.textContent =
        String(
          generationCount
        );
    }

    if (dom.recentAdditions) {
      dom.recentAdditions.textContent =
        String(
          recent.length
        );
    }

    if (dom.eventCount) {
      dom.eventCount.textContent =
        String(
          events.length
        );
    }


    if (dom.familyPreview) {

      dom.familyPreview.innerHTML =
        people
          .slice(0, 4)
          .map((person) => {

            const relatives =
              getFamilyContext(
                person.id
              );


            return `
              <div class="preview-node">
                <strong>
                  ${escapeHtml(
                    getDisplayName(
                      person
                    )
                  )}
                </strong>

                <span>
                  ${
                    relatives.parents.length
                      ? `${t(
                          'father'
                        )}/${t(
                          'mother'
                        )}:`
                      : t(
                          'familyMember'
                        )
                  }

                  ${
                    relatives.parents
                      .map(
                        (parent) =>
                          escapeHtml(
                            getDisplayName(
                              parent
                            )
                          )
                      )
                      .join(', ') ||
                    t('noData')
                  }
                </span>
              </div>
            `;
          })
          .join('');
    }


    if (dom.recentEvents) {

      dom.recentEvents.innerHTML =
        events
          .slice(0, 5)
          .map(
            (event) => `
              <div class="event-item">

                <span
                  class="event-dot"
                  style="background:${event.color};"
                ></span>

                <div>

                  <strong>
                    ${escapeHtml(
                      event.title
                    )}
                  </strong>

                  <div class="event-meta">
                    ${escapeHtml(
                      event.dateLabel
                    )}
                    •
                    ${escapeHtml(
                      event.person
                    )}
                  </div>

                </div>

              </div>
            `
          )
          .join('') ||
        `<div class="empty-state">${t(
          'noEvents'
        )}</div>`;
    }
  }


  function renderMembers() {

    if (!dom.membersList) {
      return;
    }


    const filtered =
      getFilteredPeople();


    if (!filtered.length) {

      dom.membersList.innerHTML =
        `<div class="empty-state">${t(
          'noMembers'
        )}</div>`;

      return;
    }


    dom.membersList.innerHTML =
      filtered
        .map((person) => {

          const personRelations =
            getFamilyContext(
              person.id
            );


          return `
            <button
              type="button"
              class="member-item"
              data-person-id="${escapeHtml(
                person.id
              )}"
            >

              <div class="member-avatar">
                ${escapeHtml(
                  initialsFor(
                    person
                  )
                )}
              </div>

              <div class="info">

                <strong>
                  ${escapeHtml(
                    getDisplayName(
                      person
                    )
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    person.occupation ||
                      t(
                        'unknownOccupation'
                      )
                  )}

                  •

                  ${escapeHtml(
                    person.birthDate ||
                      t('noData')
                  )}
                </span>

              </div>

              <span class="meta-pill">
                ${
                  personRelations.parents
                    .length
                    ? t(
                        'familyMembers'
                      )
                    : t(
                        'newMember'
                      )
                }
              </span>

            </button>
          `;
        })
        .join('');


    dom.membersList
      .querySelectorAll(
        '[data-person-id]'
      )
      .forEach((button) => {

        button.addEventListener(
          'click',
          () => {

            openProfile(
              button.getAttribute(
                'data-person-id'
              )
            );
          }
        );
      });
  }


  function renderTimeline() {

    if (!dom.timelineList) {
      return;
    }


    const timeline =
      buildEventList();


    if (!timeline.length) {

      dom.timelineList.innerHTML =
        `<div class="empty-state">${t(
          'noEvents'
        )}</div>`;

      return;
    }


    dom.timelineList.innerHTML =
      timeline
        .map(
          (event) => `
            <div class="timeline-item">

              <div class="year">
                ${event.year}
              </div>

              <div class="content">

                <div>

                  <strong>
                    ${escapeHtml(
                      event.title
                    )}
                  </strong>

                  <div class="event-meta">
                    ${escapeHtml(
                      event.person
                    )}
                  </div>

                </div>

                <span>
                  ${escapeHtml(
                    event.label
                  )}
                </span>

              </div>

            </div>
          `
        )
        .join('');
  }


  function renderPhotos() {

    if (!dom.photosGrid) {
      return;
    }


    const photos =
      state.people.filter(
        (person) =>
          person.photo ||
          person.firstName
      );


    if (!photos.length) {

      dom.photosGrid.innerHTML =
        `<div class="empty-state">${t(
          'noPhotos'
        )}</div>`;

      return;
    }


    dom.photosGrid.innerHTML =
      photos
        .map((person) => {

          const src =
            person.photo ||
            'https://placehold.co/600x600/efe8ff/5c3b9a?text=' +
              encodeURIComponent(
                initialsFor(
                  person
                )
              );


          return `
            <article
              class="photo-card"
              data-person-id="${escapeHtml(
                person.id
              )}"
            >

              <img
                src="${escapeHtml(
                  src
                )}"
                alt="${escapeHtml(
                  getDisplayName(
                    person
                  )
                )}"
              />

              <div class="meta">

                <strong>
                  ${escapeHtml(
                    getDisplayName(
                      person
                    )
                  )}
                </strong>

                <div class="event-meta">
                  ${escapeHtml(
                    person.occupation ||
                      t(
                        'familyMember'
                      )
                  )}
                </div>

              </div>

            </article>
          `;
        })
        .join('');


    dom.photosGrid
      .querySelectorAll(
        '[data-person-id]'
      )
      .forEach((card) => {

        card.addEventListener(
          'click',
          () => {

            openProfile(
              card.getAttribute(
                'data-person-id'
              )
            );
          }
        );
      });
  }


  function renderSearchResults() {

    const target =
      document.getElementById(
        'search-results'
      );

    if (!target) {
      return;
    }


    const results =
      getFilteredPeople();


    target.innerHTML =
      results
        .slice(0, 20)
        .map(
          (person) =>
            `<option value="${escapeHtml(
              getDisplayName(
                person
              )
            )}"></option>`
        )
        .join('');
  }


  function renderProfilePanel() {

    if (!dom.profilePanel) {
      return;
    }


    const person =
      getPersonById(
        state.selectedPersonId
      );


    if (!person) {

      dom.profilePanel.classList.add(
        'closed'
      );

      return;
    }


    dom.profileName.textContent =
      getDisplayName(
        person
      );


    dom.profileAvatar.textContent =
      initialsFor(
        person
      );


    const relations =
      getFamilyContext(
        person.id
      );


    const photo =
      person.photo || '';


    dom.profileContent.innerHTML = `

      ${
        photo
          ? `
            <img
              src="${escapeHtml(
                photo
              )}"
              alt="${escapeHtml(
                getDisplayName(
                  person
                )
              )}"
              style="
                width:100%;
                height:200px;
                object-fit:cover;
                border-radius:16px;
                margin-bottom:12px;
              "
            />
          `
          : ''
      }


      <div class="profile-grid">

        <div class="profile-field">
          <span>${t('gender')}</span>
          <strong>
            ${t(
              person.gender ||
                'other'
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('dateOfBirth')}</span>
          <strong>
            ${escapeHtml(
              person.birthDate ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('birthPlace')}</span>
          <strong>
            ${escapeHtml(
              person.birthPlace ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('dateOfDeath')}</span>
          <strong>
            ${escapeHtml(
              person.deathDate ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('deathPlace')}</span>
          <strong>
            ${escapeHtml(
              person.deathPlace ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('occupation')}</span>
          <strong>
            ${escapeHtml(
              person.occupation ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('phone')}</span>
          <strong>
            ${escapeHtml(
              person.phone ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('email')}</span>
          <strong>
            ${escapeHtml(
              person.email ||
                t('noData')
            )}
          </strong>
        </div>


        <div class="profile-field">
          <span>${t('address')}</span>
          <strong>
            ${escapeHtml(
              person.address ||
                t('noData')
            )}
          </strong>
        </div>

      </div>


      <div style="margin-top:16px;">

        <h4>${t('notes')}</h4>

        <p>
          ${escapeHtml(
            person.biography ||
              t('noData')
          )}
        </p>

      </div>


      <div style="margin-top:16px;">

        <h4>
          ${t('father')} /
          ${t('mother')}
        </h4>

        <p>
          ${
            relations.parents.length
              ? relations.parents
                  .map(
                    (parent) =>
                      escapeHtml(
                        getDisplayName(
                          parent
                        )
                      )
                  )
                  .join(', ')
              : t('noData')
          }
        </p>

      </div>


      <div style="margin-top:16px;">

        <h4>
          ${t('husband')} /
          ${t('wife')}
        </h4>

        <p>
          ${
            relations.spouse.length
              ? relations.spouse
                  .map(
                    (spouse) =>
                      escapeHtml(
                        getDisplayName(
                          spouse
                        )
                      )
                  )
                  .join(', ')
              : t('noData')
          }
        </p>

      </div>


      <div style="margin-top:16px;">

        <h4>
          ${t('son')} /
          ${t('daughter')}
        </h4>

        <p>
          ${
            relations.children.length
              ? relations.children
                  .map(
                    (child) =>
                      escapeHtml(
                        getDisplayName(
                          child
                        )
                      )
                  )
                  .join(', ')
              : t('noData')
          }
        </p>

      </div>


      <div style="margin-top:16px;">

        <h4>
          ${t('brother')} /
          ${t('sister')}
        </h4>

        <p>
          ${
            relations.siblings.length
              ? relations.siblings
                  .map(
                    (sibling) =>
                      escapeHtml(
                        getDisplayName(
                          sibling
                        )
                      )
                  )
                  .join(', ')
              : t('noData')
          }
        </p>

      </div>
    `;


  }


  function openProfile(
    personId
  ) {

    state.selectedPersonId =
      personId;


    setActiveSection(
      'tree'
    );


    renderProfilePanel();
    dom.profilePanel.classList.remove(
      'closed'
    );
    renderFamilyTree();
    centerTree();
  }


  function closeProfilePanel() {

    if (dom.profilePanel) {
      dom.profilePanel.classList.add(
        'closed'
      );
    }
  }


  function openMemberModal(
    personId = null,
    relatedPersonId = null
  ) {

    dom.memberFormError.hidden = true;
    dom.memberFormError.textContent = '';

    const selectedPerson =
      getPersonById(
        state.selectedPersonId
      ) ||
      getPersonById(
        relatedPersonId
      );


    const editMode =
      Boolean(personId);


    let editingPerson =
      null;


    if (editMode) {

      editingPerson =
        getPersonById(
          personId
        );


      if (!editingPerson) {
        return;
      }


      populateForm(
        editingPerson
      );

    } else {

      dom.memberForm.reset();


      document.getElementById(
        'member-id'
      ).value = '';


      document.getElementById(
        'relationship-type'
      ).value =
        relatedPersonId
          ? 'father'
          : 'none';
    }


    const rootPerson =
      relatedPersonId
        ? getPersonById(
            relatedPersonId
          )
        : selectedPerson;


    updateRelatedPersonOptions(
      rootPerson
        ? rootPerson.id
        : ''
    );


    if (editingPerson) {

      populateRelationshipFields(
        editingPerson
      );
    }


    if (relatedPersonId) {

      dom.relationshipType.value =
        'father';


      updateRelatedPersonOptions(
        relatedPersonId
      );


      document.getElementById(
        'related-person'
      ).value =
        relatedPersonId;
    }


    dom.memberModalTitle.textContent =
      editMode
        ? t('editTitle')
        : t('addTitle');


    dom.memberModal.classList.remove(
      'hidden'
    );
  }


  function populateForm(
    person
  ) {

    document.getElementById(
      'member-id'
    ).value =
      person.id;


    document.getElementById(
      'full-name'
    ).value =
      getDisplayName(
        person
      );


    document.getElementById(
      'nickname'
    ).value =
      person.nickname || '';


    document.getElementById(
      'gender'
    ).value =
      person.gender ||
      'other';


    document.getElementById(
      'birth-date'
    ).value =
      person.birthDate ||
      '';


    document.getElementById(
      'birth-place'
    ).value =
      person.birthPlace ||
      '';


    document.getElementById(
      'death-date'
    ).value =
      person.deathDate ||
      '';


    document.getElementById(
      'death-place'
    ).value =
      person.deathPlace ||
      '';


    document.getElementById(
      'phone'
    ).value =
      person.phone ||
      '';


    document.getElementById(
      'email'
    ).value =
      person.email ||
      '';


    document.getElementById(
      'address'
    ).value =
      person.address ||
      '';


    document.getElementById(
      'occupation'
    ).value =
      person.occupation ||
      '';


    document.getElementById(
      'photo'
    ).value =
      person.photo ||
      '';


    document.getElementById(
      'biography'
    ).value =
      person.biography ||
      '';
  }


  function closeMemberModal() {

    dom.memberModal.classList.add(
      'hidden'
    );

    dom.memberForm.reset();
    dom.memberFormError.hidden = true;
    dom.memberFormError.textContent = '';
  }


  function handleFormSubmit(
    event
  ) {

    event.preventDefault();

    if (
      state.isSavingMember ||
      !dom.memberForm.reportValidity()
    ) {
      return;
    }

    dom.memberFormError.hidden = true;
    dom.memberFormError.textContent = '';

    state.isSavingMember = true;

    const previousPeople = [...state.people];
    const previousRelationships = [...state.relationships];
    const previousSelectedPersonId = state.selectedPersonId;
    let localSaveSucceeded = false;

    try {
      localSaveSucceeded = saveMemberFromForm();

      if (!localSaveSucceeded) {
        return;
      }

      renderAll();
      closeMemberModal();
    } catch (error) {
      if (!localSaveSucceeded) {
        state.people = previousPeople;
        state.relationships = previousRelationships;
        state.selectedPersonId = previousSelectedPersonId;
      }

      console.error(
        'Could not save family member:',
        error
      );

      setAuthStatus(
        'saveFailed',
        error instanceof Error
          ? error.message
          : String(error)
      );

      dom.memberFormError.textContent =
        t('saveFailed');
      dom.memberFormError.hidden = false;
    } finally {
      state.isSavingMember = false;
    }
  }


  function saveMemberFromForm() {

    const memberId =
      document.getElementById(
        'member-id'
      ).value;


    const formData =
      new FormData(
        dom.memberForm
      );


    const fullName =
      String(
        formData.get(
          'fullName'
        ) || ''
      ).trim();


    if (!fullName) {
      dom.memberFormError.textContent =
        t('nameRequired');
      dom.memberFormError.hidden = false;
      document.getElementById('full-name').focus();
      return false;
    }


    const nameParts =
      fullName.split(
        /\s+/
      );


    let personId = memberId;

    if (!personId) {
      do {
        personId = cryptoRandomId('person');
      } while (
        state.people.some(
          (person) => person.id === personId
        )
      );

      document.getElementById(
        'member-id'
      ).value = personId;
    }


    const personData = {

      id: personId,

      firstName:
        nameParts.shift() ||
        '',

      lastName:
        nameParts.join(' '),

      nickname:
        String(
          formData.get(
            'nickname'
          ) || ''
        ).trim(),

      gender:
        String(
          formData.get(
            'gender'
          ) || 'other'
        ),

      birthDate:
        String(
          formData.get(
            'birthDate'
          ) || ''
        ),

      birthPlace:
        String(
          formData.get(
            'birthPlace'
          ) || ''
        ),

      deathDate:
        String(
          formData.get(
            'deathDate'
          ) || ''
        ),

      deathPlace:
        String(
          formData.get(
            'deathPlace'
          ) || ''
        ),

      phone:
        String(
          formData.get(
            'phone'
          ) || ''
        ).trim(),

      email:
        String(
          formData.get(
            'email'
          ) || ''
        ).trim(),

      address:
        String(
          formData.get(
            'address'
          ) || ''
        ).trim(),

      photo:
        String(
          formData.get(
            'photo'
          ) || ''
        ),

      occupation:
        String(
          formData.get(
            'occupation'
          ) || ''
        ),

      biography:
        String(
          formData.get(
            'biography'
          ) || ''
        )
    };


    const existingIndex =
      state.people.findIndex(
        (person) =>
          person.id ===
          personData.id
      );


    if (
      existingIndex >= 0
    ) {

      state.people[
        existingIndex
      ] = {
        ...state.people[
          existingIndex
        ],
        ...personData
      };

    } else {

      state.people.push(
        createPerson(
          personData
        )
      );
    }


    const familyRelations = {

      fatherId:
        dom.fatherPerson.value,

      motherId:
        dom.motherPerson.value,

      spouseIds:
        [
          ...dom.spousePerson
            .selectedOptions
        ].map(
          (option) =>
            option.value
        ),

      childrenIds:
        [
          ...dom.childrenPerson
            .selectedOptions
        ].map(
          (option) =>
            option.value
        )
    };


    replaceFamilyRelationships(
      personData.id,
      familyRelations
    );


    const relationType =
      document.getElementById(
        'relationship-type'
      ).value;


    const relatedId =
      document.getElementById(
        'related-person'
      ).value;


    let hasRelationship =
      Boolean(
        familyRelations.fatherId ||
        familyRelations.motherId ||
        familyRelations.spouseIds
          .length ||
        familyRelations.childrenIds
          .length
      );


    if (
      relationType !==
        'none' &&
      relatedId
    ) {

      const personIsRelativeOfSelected =
        [
          'father',
          'mother',
          'grandfather',
          'grandmother',
          'uncle',
          'aunt',
          'brother',
          'sister',
          'husband',
          'wife',
          'cousin',
          'other'
        ].includes(
          relationType
        );


      if (
        personIsRelativeOfSelected
      ) {

        addRelationshipByType(
          personData.id,
          relatedId,
          relationType
        );

      } else {

        addRelationshipByType(
          relatedId,
          personData.id,
          relationType
        );
      }


      hasRelationship =
        true;
    }


    if (
      hasRelationship
    ) {

      state.selectedPersonId =
        personData.id;
    }


    if (
      !saveFamilyData()
    ) {
      throw new Error(t('saveFailed'));
    }


    return true;
  }


  function updateRelatedPersonOptions(
    selectedId = ''
  ) {

    const relationType =
      dom.relationshipType.value;


    const editingId =
      document.getElementById(
        'member-id'
      ).value;


    const options =
      state.people.filter(
        (person) =>
          person.id !==
          editingId
      );


    const selectedValues =
      new Map([
        [
          dom.relatedPerson,
          selectedId
            ? [selectedId]
            : [
                dom.relatedPerson
                  .value ||
                  state.selectedPersonId ||
                  ''
              ]
        ],

        [
          dom.fatherPerson,
          [
            dom.fatherPerson.value
          ]
        ],

        [
          dom.motherPerson,
          [
            dom.motherPerson.value
          ]
        ],

        [
          dom.spousePerson,
          [
            ...dom.spousePerson
              .selectedOptions
          ].map(
            (option) =>
              option.value
          )
        ],

        [
          dom.childrenPerson,
          [
            ...dom.childrenPerson
              .selectedOptions
          ].map(
            (option) =>
              option.value
          )
        ]
      ]);


    const selectInputs = [
      dom.relatedPerson,
      dom.fatherPerson,
      dom.motherPerson,
      dom.spousePerson,
      dom.childrenPerson
    ];


    selectInputs.forEach(
      (select) => {

        if (!select) {
          return;
        }


        const isGeneric =
          select ===
          dom.relatedPerson;


        const isOptionalSingle =
          select ===
            dom.fatherPerson ||
          select ===
            dom.motherPerson;


        const placeholder =
          isGeneric ||
          isOptionalSingle
            ? `<option value="">${t(
                'chooseMember'
              )}</option>`
            : '';


        const optionMarkup =
          options
            .map(
              (person) => {

                const selected =
                  selectedValues
                    .get(select)
                    ?.includes(
                      person.id
                    );


                return `
                  <option
                    value="${escapeHtml(
                      person.id
                    )}"
                    ${
                      selected
                        ? 'selected'
                        : ''
                    }
                  >
                    ${escapeHtml(
                      getDisplayName(
                        person
                      )
                    )}
                  </option>
                `;
              }
            )
            .join('');


        select.innerHTML =
          `${placeholder}${optionMarkup}`;
      }
    );


    dom.relatedPerson.disabled =
      relationType ===
      'none';
  }


  function populateRelationshipFields(
    person
  ) {

    const parentRelations =
      state.relationships.filter(
        (relation) =>
          relation.type ===
            'parentOf' &&
          relation.to ===
            person.id
      );


    let father =
      parentRelations.find(
        (relation) =>
          relation.role ===
          'father'
      );


    let mother =
      parentRelations.find(
        (relation) =>
          relation.role ===
          'mother'
      );


    const unassignedParents =
      parentRelations.filter(
        (relation) =>
          relation !==
            father &&
          relation !==
            mother
      );


    if (!father) {

      father =
        unassignedParents.find(
          (relation) =>
            getPersonById(
              relation.from
            )?.gender ===
            'male'
        );
    }


    if (!mother) {

      mother =
        unassignedParents.find(
          (relation) =>
            relation !==
              father &&
            getPersonById(
              relation.from
            )?.gender ===
            'female'
        );
    }


    if (
      !father &&
      !mother &&
      unassignedParents.length
    ) {

      father =
        unassignedParents[0];
    }


    if (!mother) {

      mother =
        unassignedParents.find(
          (relation) =>
            relation !==
            father
        );
    }


    dom.fatherPerson.value =
      father?.from ||
      '';


    dom.motherPerson.value =
      mother?.from ||
      '';


    [
      ...dom.spousePerson.options
    ].forEach(
      (option) => {

        option.selected =
          state.relationships.some(
            (relation) =>
              relation.type ===
                'spouseOf' &&
              (
                (
                  relation.from ===
                    person.id &&
                  relation.to ===
                    option.value
                ) ||
                (
                  relation.to ===
                    person.id &&
                  relation.from ===
                    option.value
                )
              )
          );
      }
    );


    [
      ...dom.childrenPerson.options
    ].forEach(
      (option) => {

        option.selected =
          state.relationships.some(
            (relation) =>
              relation.type ===
                'parentOf' &&
              relation.from ===
                person.id &&
              relation.to ===
                option.value
          );
      }
    );
  }


  function replaceFamilyRelationships(
    personId,
    familyRelations
  ) {

    state.relationships =
      state.relationships.filter(
        (relation) =>
          !(
            (
              relation.type ===
                'parentOf' &&
              (
                relation.from ===
                  personId ||
                relation.to ===
                  personId
              )
            ) ||
            (
              relation.type ===
                'spouseOf' &&
              (
                relation.from ===
                  personId ||
                relation.to ===
                  personId
              )
            )
          )
      );


    const add = (
      type,
      from,
      to,
      role
    ) => {

      if (
        !from ||
        !to ||
        from === to
      ) {
        return;
      }


      if (
        state.relationships.some(
          (relation) =>
            relation.type ===
              type &&
            relation.from ===
              from &&
            relation.to ===
              to
        )
      ) {
        return;
      }


      state.relationships.push({

        id:
          cryptoRandomId(
            'rel'
          ),

        type,

        from,

        to,

        ...(role
          ? { role }
          : {})
      });
    };


    add(
      'parentOf',
      familyRelations.fatherId,
      personId,
      'father'
    );


    add(
      'parentOf',
      familyRelations.motherId,
      personId,
      'mother'
    );


    familyRelations.spouseIds
      .forEach(
        (spouseId) =>
          add(
            'spouseOf',
            personId,
            spouseId
          )
      );


    familyRelations.childrenIds
      .forEach(
        (childId) =>
          add(
            'parentOf',
            personId,
            childId,
            'child'
          )
      );
  }


  function addRelationshipByType(
    fromId,
    toId,
    relationType
  ) {

    if (
      !fromId ||
      !toId ||
      fromId === toId
    ) {
      return;
    }


    const relationMap = {

      father: {
        type: 'parentOf',
        from: fromId,
        to: toId
      },

      mother: {
        type: 'parentOf',
        from: fromId,
        to: toId
      },

      son: {
        type: 'parentOf',
        from: fromId,
        to: toId
      },

      daughter: {
        type: 'parentOf',
        from: fromId,
        to: toId
      },

      brother: {
        type: 'siblingOf',
        from: fromId,
        to: toId
      },

      sister: {
        type: 'siblingOf',
        from: fromId,
        to: toId
      },

      husband: {
        type: 'spouseOf',
        from: fromId,
        to: toId
      },

      wife: {
        type: 'spouseOf',
        from: fromId,
        to: toId
      },

      grandfather: {
        type: 'grandparentOf',
        from: fromId,
        to: toId
      },

      grandmother: {
        type: 'grandparentOf',
        from: fromId,
        to: toId
      },

      uncle: {
        type: 'uncleOf',
        from: fromId,
        to: toId
      },

      aunt: {
        type: 'auntOf',
        from: fromId,
        to: toId
      },

      cousin: {
        type: 'cousinOf',
        from: fromId,
        to: toId
      },

      other: {
        type: 'otherRelativeOf',
        from: fromId,
        to: toId
      }
    };


    const relation =
      relationMap[
        relationType
      ];


    if (!relation) {
      return;
    }


    const duplicate =
      state.relationships.some(
        (item) =>
          item.type ===
            relation.type &&
          item.from ===
            relation.from &&
          item.to ===
            relation.to
      );


    if (!duplicate) {

      state.relationships.push({

        id:
          cryptoRandomId(
            'rel'
          ),

        ...relation,

        role:
          relationType
      });
    }
  }


  function saveFamilyData() {

    if (state.isDeletingAll) return false;

    const data =
      JSON.parse(
        JSON.stringify({
          people:
            state.people,

          relationships:
            state.relationships
        })
      );


    const key =
      state.user
        ? userStorageKey(
            state.user.uid
          )
        : FAMILY_STORAGE_KEY;


    if (
      !writeTreeData(
        data,
        key
      )
    ) {

      setAuthStatus(
        'saveFailed'
      );

      return false;
    }


    updateStorageStatus();


    setAuthStatus(
      state.user
        ? 'cloudSaving'
        : 'localSaved'
    );


    if (
      !state.user ||
      !state.firebase
    ) {

      return true;
    }


    const uid =
      state.user.uid;


    state.cloudSaveQueue =
      state.cloudSaveQueue
        .then(
          () =>
            state.firebase.saveFamily(
              uid,
              data
            )
        )
        .then(() => {

          if (
            state.user?.uid ===
            uid
          ) {

            state.cloudSaveError = null;
            setAuthStatus(
              'cloudSaved'
            );
          }
        })
        .catch(
          (error) => {

            console.error(
              'Could not save family data to Firestore:',
              error
            );


            if (
              state.user?.uid ===
              uid
            ) {

              state.cloudSaveError = error;
              setAuthStatus(
                'saveFailed',
                error.message
              );
            }
          }
        );


    return true;
  }


  function updateStorageStatus() {

    if (!dom.storageStatus) {
      return;
    }


    const bytes =
      JSON.stringify({
        people:
          state.people,

        relationships:
          state.relationships
      }).length;


    dom.storageStatus.textContent =
      `${t(
        'localSaved'
      )} • ${(bytes / 1024).toFixed(
        2
      )} KB`;
  }


  function exportFamilyData() {

    const payload = {

      people:
        state.people,

      relationships:
        state.relationships,

      exportedAt:
        new Date().toISOString()
    };


    exportTreeJson(
      payload
    );
  }


  function handleImportFile(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    importTreeJson(file)

      .then((payload) => {

        state.people =
          payload.people ||
          [];

        state.relationships =
          payload.relationships ||
          [];

        state.selectedPersonId =
          state.people[0]?.id ||
          null;


        if (
          !saveFamilyData()
        ) {
          return;
        }


        renderAll();


        dom.importFileInput.value =
          '';

      })

      .catch((error) => {

        alert(
          `${t(
            'importFailed'
          )} ${error.message}`
        );
      });
  }

  const MAX_GEDCOM_FILE_SIZE = 15 * 1024 * 1024;

  function gedcomFingerprint(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function sameGedcomPerson(first, second) {
    const normalize = (value) => String(value || '').trim().toLocaleLowerCase();
    if (
      normalize(first.firstName) !== normalize(second.firstName) ||
      normalize(first.lastName) !== normalize(second.lastName)
    ) return false;

    const knownDates = ['birthDate', 'deathDate']
      .filter((key) => first[key]);
    return knownDates.length > 0 &&
      knownDates.every((key) => normalize(first[key]) === normalize(second[key]));
  }

  function gedcomMatches(person) {
    return state.people.find((existing) =>
      (person.gedcomRef && existing.gedcomRef === person.gedcomRef) ||
      sameGedcomPerson(person, existing)
    );
  }

  function handleGedcomFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const clearInput = () => {
      if (dom.importGedcomFile) dom.importGedcomFile.value = '';
    };
    if (!/\.ged$/i.test(file.name)) {
      alert('Choose a GEDCOM file with a .ged extension.');
      clearInput();
      return;
    }
    if (!file.size) {
      alert(t('gedcomEmpty'));
      clearInput();
      return;
    }
    if (file.size > MAX_GEDCOM_FILE_SIZE) {
      alert('The GEDCOM file is too large. The maximum supported size is 15 MB.');
      clearInput();
      return;
    }

    file.text()
      .then((text) => {
        const parsed = parseGedcom(text);
        const sourceFingerprint = gedcomFingerprint(text);
        parsed.people = parsed.people.map((person) => ({
          ...person,
          gedcomRef: `${sourceFingerprint}:${person.gedcomId}`
        }));
        state.pendingGedcomImport = parsed;

        const duplicates = parsed.people.filter((person) => gedcomMatches(person)).length;
        const newPeople = parsed.people.length - duplicates;
        dom.gedcomPreviewSummary.textContent =
          `${parsed.people.length} people and ${parsed.relationships.length} relationships detected. ` +
          `${newPeople} new people will be added; ${duplicates} likely duplicates will be matched to existing members.`;
        const peopleByGedcomId = new Map(parsed.people.map((person) => [
          person.gedcomId,
          `${person.firstName} ${person.lastName}`.trim() || t('unknownMember')
        ]));
        const populatePreviewList = (list, items, renderItem, totalCount) => {
          list.replaceChildren();
          items.slice(0, 20).forEach((item) => {
            const row = document.createElement('li');
            row.textContent = renderItem(item);
            list.append(row);
          });
          if (totalCount > 20) {
            const row = document.createElement('li');
            row.textContent = `Showing 20 of ${totalCount}.`;
            list.append(row);
          } else if (!totalCount) {
            const row = document.createElement('li');
            row.textContent = 'None detected.';
            list.append(row);
          }
        };
        populatePreviewList(
          dom.gedcomPreviewPeople,
          parsed.people,
          (person) => {
            const dates = [
              person.birthDate ? `born ${person.birthDate}` : '',
              person.deathDate ? `died ${person.deathDate}` : ''
            ].filter(Boolean).join(', ');
            const name = peopleByGedcomId.get(person.gedcomId);
            return `${name}${dates ? ` (${dates})` : ''}`;
          },
          parsed.people.length
        );
        populatePreviewList(
          dom.gedcomPreviewRelationships,
          parsed.relationships,
          (relationship) => {
            const from = peopleByGedcomId.get(relationship.from) || relationship.from;
            const to = peopleByGedcomId.get(relationship.to) || relationship.to;
            return relationship.type === 'spouseOf'
              ? `Spouse: ${from} <-> ${to}`
              : `${relationship.role === 'mother' ? 'Mother' : 'Father'}: ${from} -> ${to}`;
          },
          parsed.relationships.length
        );
        dom.gedcomPreviewWarnings.replaceChildren();
        parsed.warnings.forEach((warning) => {
          const item = document.createElement('li');
          item.textContent = warning;
          dom.gedcomPreviewWarnings.append(item);
        });
        dom.gedcomPreviewModal.classList.remove('hidden');
        dom.gedcomImportConfirmBtn.disabled = false;
      })
      .catch((error) => {
        console.error('GEDCOM import preview failed:', error);
        alert(`GEDCOM import failed: ${error.message}`);
        clearInput();
      });
  }

  function cancelGedcomImport() {
    state.pendingGedcomImport = null;
    dom.gedcomPreviewModal?.classList.add('hidden');
    if (dom.importGedcomFile) dom.importGedcomFile.value = '';
  }

  async function importPendingGedcom() {
    const parsed = state.pendingGedcomImport;
    if (!parsed || dom.gedcomImportConfirmBtn?.disabled) return;
    dom.gedcomImportConfirmBtn.disabled = true;

    const previousPeople = state.people;
    const previousRelationships = state.relationships;
    state.people = [...state.people];
    state.relationships = [...state.relationships];
    const sourceIds = new Map();
    const fingerprint = parsed.people[0]?.gedcomRef?.split(':')[0] || 'gedcom';
    let addedPeople = 0;
    let addedRelationships = 0;

    parsed.people.forEach((person) => {
      const existing = gedcomMatches(person);
      if (existing) {
        sourceIds.set(person.gedcomId, existing.id);
      } else {
        const created = createPerson({
          ...person,
          id: cryptoRandomId('person')
        });
        created.gedcomRef = `${fingerprint}:${person.gedcomId}`;
        state.people.push(created);
        sourceIds.set(person.gedcomId, created.id);
        addedPeople += 1;
      }
    });

    const relationshipExists = (candidate) => state.relationships.some((relation) => {
      if (relation.type !== candidate.type) return false;
      if (candidate.type === 'spouseOf') {
        return (relation.from === candidate.from && relation.to === candidate.to) ||
          (relation.from === candidate.to && relation.to === candidate.from);
      }
      return relation.from === candidate.from && relation.to === candidate.to;
    });

    parsed.relationships.forEach((relationship) => {
      const from = sourceIds.get(relationship.from);
      const to = sourceIds.get(relationship.to);
      if (!from || !to || from === to) return;
      const candidate = { ...relationship, from, to };
      if (relationshipExists(candidate)) return;
      state.relationships.push({
        id: cryptoRandomId('rel'),
        ...candidate
      });
      addedRelationships += 1;
    });

    if (!saveFamilyData()) {
      state.people = previousPeople;
      state.relationships = previousRelationships;
      dom.gedcomImportConfirmBtn.disabled = false;
      return;
    }

    state.selectedPersonId ||= state.people[0]?.id || null;
    renderAll();
    await state.cloudSaveQueue;
    const cloudError = state.user ? state.cloudSaveError : null;
    const warnings = parsed.warnings.length
      ? `\n\nNot imported: ${parsed.warnings.join(' ')}`
      : '';
    const result = cloudError
      ? `${t('gedcomImportCloudFailed')} ${cloudError.message}\n\nThe imported records remain saved on this device.`
      : `${t('gedcomImportSuccess')} ${addedPeople} people and ${addedRelationships} relationships added. Photos and unsupported fields were not imported.`;
    cancelGedcomImport();
    alert(`${result}${warnings}`);
  }

  function openDeleteAllConfirmation() {
    if (state.isDeletingAll) return;
    dom.deleteAllError.hidden = true;
    dom.deleteAllError.textContent = '';
    dom.deleteAllCancelBtn.disabled = false;
    dom.deleteAllConfirmBtn.disabled = false;
    dom.deleteAllModal.classList.remove('hidden');
  }

  function closeDeleteAllConfirmation() {
    if (state.isDeletingAll) return;
    dom.deleteAllModal?.classList.add('hidden');
  }

  async function deleteAllFamilyData() {
    if (state.isDeletingAll) return;
    const deletingUid = state.user?.uid || null;
    const deletingFirebase = state.firebase;
    state.isDeletingAll = true;
    ++state.cloudLoadToken;
    dom.deleteAllCancelBtn.disabled = true;
    dom.deleteAllConfirmBtn.disabled = true;
    dom.deleteAllConfirmBtn.textContent = 'Deleting…';
    dom.deleteAllError.hidden = true;
    let deletionSource = 'local device storage';
    let localStorageCleared = false;

    try {
      await state.cloudSaveQueue;
      if (deletingUid && !deletingFirebase) {
        throw new Error('Firebase is unavailable. No data was deleted.');
      }

      const localKeys = deletingUid
        ? [userStorageKey(deletingUid)]
        : [FAMILY_STORAGE_KEY];
      localKeys.forEach((key) => localStorage.removeItem(key));
      localStorageCleared = true;

      if (deletingUid) {
        deletionSource = 'Firestore';
        await deletingFirebase.deleteFamily(deletingUid);
      }

      if ((state.user?.uid || null) === deletingUid) {
        state.people = [];
        state.relationships = [];
        state.selectedPersonId = null;
        state.cloudSaveError = null;
        renderAll();
      }
      dom.deleteAllModal.classList.add('hidden');
      alert(t('deleteAllSuccess'));
    } catch (error) {
      console.error('Delete All failed:', error);
      dom.deleteAllError.textContent =
        `${t('deleteAllFailed')} ${deletionSource}: ${error.message}` +
        (localStorageCleared && deletingUid
          ? ' The local cache was cleared, but Firestore deletion still needs attention.'
          : '');
      dom.deleteAllError.hidden = false;
      dom.deleteAllCancelBtn.disabled = false;
      dom.deleteAllConfirmBtn.disabled = false;
    } finally {
      state.isDeletingAll = false;
      dom.deleteAllConfirmBtn.textContent = t('deleteAll');
    }
  }


  function handleTreeAction(
    action
  ) {
    if (action === 'zoom-in') {
      changeZoom(state.tree.scale + 0.15);
    } else if (action === 'zoom-out') {
      changeZoom(state.tree.scale - 0.15);
    } else if (action === 'center') {
      centerTree();
    } else if (action === 'fit') {
      fitTreeToViewport();
    } else if (action === 'reset-view') {
      state.tree.scale = 1;
      centerTree();
    } else if (action === 'expand') {
      state.tree.maxDepth += 1;
    } else if (action === 'collapse') {
      state.tree.maxDepth = Math.max(1, state.tree.maxDepth - 1);
    }

    renderFamilyTree();
  }


  function changeZoom(
    value
  ) {
    state.tree.scale = Math.min(2.2, Math.max(0.25, value));
    renderFamilyTree();
  }


  function centerTree() {
    const person = getPersonById(state.selectedPersonId);
    const node = person
      ? [...dom.treeSvg.querySelectorAll('.tree-node')]
        .find((entry) => entry.dataset.personId === person.id)
      : null;
    const viewportWidth = dom.treeViewport.clientWidth;
    const viewportHeight = dom.treeViewport.clientHeight;

    if (node) {
      const transform = node.getAttribute('transform') || '';
      const [, x = 0, y = 0] = transform.match(
        /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/
      ) || [];
      state.tree.panX = viewportWidth / 2 - (Number(x) + 108) * state.tree.scale;
      state.tree.panY = viewportHeight / 2 - (Number(y) + 57) * state.tree.scale;
    } else {
      state.tree.panX = viewportWidth / 2 - 108 * state.tree.scale;
      state.tree.panY = viewportHeight / 2 - 57 * state.tree.scale;
    }
    renderFamilyTree();
  }


  function fitTreeToViewport() {
    const width = Number(dom.treeSvg.getAttribute('width')) || 0;
    const height = Number(dom.treeSvg.getAttribute('height')) || 0;
    const viewportWidth = dom.treeViewport.clientWidth;
    const viewportHeight = dom.treeViewport.clientHeight;

    if (!width || !height || !viewportWidth || !viewportHeight) {
      return;
    }

    state.tree.scale = Math.min(
      2.2,
      Math.max(0.02, Math.min(
        (viewportWidth - 48) / width,
        (viewportHeight - 48) / height
      )
      )
    );
    state.tree.panX = (viewportWidth - width * state.tree.scale) / 2;
    state.tree.panY = (viewportHeight - height * state.tree.scale) / 2;
    renderFamilyTree();
  }

  async function makePdfImagesLocal(svg) {
    const imageElements = [...svg.querySelectorAll('image')];
    await Promise.all(imageElements.map(async (image) => {
      const source = image.getAttribute('href') || image.getAttributeNS(
        'http://www.w3.org/1999/xlink',
        'href'
      );
      if (!source) return;
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Image request failed (${response.status})`);
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        image.setAttribute('href', dataUrl);
      } catch (error) {
        const group = image.parentElement;
        const clipPath = image.getAttribute('clip-path');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'node-avatar-placeholder');
        circle.setAttribute('cx', '34');
        circle.setAttribute('cy', '54');
        circle.setAttribute('r', '23');
        if (clipPath) circle.setAttribute('clip-path', clipPath);
        image.replaceWith(circle);
        if (group) {
          const person = getPersonById(group.getAttribute('data-person-id'));
          if (person) {
            const initials = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            initials.setAttribute('class', 'node-initials');
            initials.setAttribute('x', '34');
            initials.setAttribute('y', '58');
            initials.setAttribute('text-anchor', 'middle');
            initials.textContent = initialsFor(person);
            group.appendChild(initials);
          }
        }
        console.warn('A profile photo could not be embedded in the PDF.', error);
      }
    }));
  }

  async function renderSvgForPdf(svg, width, height) {
    const markup = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const imageUrl = URL.createObjectURL(new Blob(
      [markup],
      { type: 'image/svg+xml;charset=utf-8' }
    ));
    try {
      image.src = imageUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(width));
      canvas.height = Math.max(1, Math.ceil(height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is unavailable.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight
      );
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      context.drawImage(
        image,
        (canvas.width - drawnWidth) / 2,
        (canvas.height - drawnHeight) / 2,
        drawnWidth,
        drawnHeight
      );
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  function treeSvgContent(layout, selectedPersonId = '') {
    const defs = layout.positions.map((entry, index) => `
      <clipPath id="tree-avatar-${index}">
        <circle cx="34" cy="54" r="23"></circle>
      </clipPath>
    `).join('');
    const links = layout.links.map((link) => `
      <path class="tree-link ${link.type === 'spouse' ? 'spouse-link' : ''}"
        d="${link.path}" style="stroke:${link.color}"></path>
    `).join('');
    const nodeMarkup = layout.positions.map((entry, index) => {
      const person = getPersonById(entry.id);
      if (!person) return '';

      const isSelected = entry.id === selectedPersonId;
      const deceased = Boolean(person.deathDate);
      const birthYear = treeDateLabel(person.birthDate);
      const deathYear = treeDateLabel(person.deathDate);
      const dates = [
        birthYear ? `* ${birthYear}` : '',
        deathYear ? `† ${deathYear}` : ''
      ].filter(Boolean).join('  ·  ');
      const name = getDisplayName(person);
      const nameLength = Math.min(140, Math.max(40, name.length * 7));
      const photo = person.photo
        ? `<image class="node-photo" href="${escapeHtml(person.photo)}"
            x="11" y="31" width="46" height="46" preserveAspectRatio="xMidYMid slice"
            clip-path="url(#tree-avatar-${index})"></image>`
        : `<circle class="node-avatar-placeholder" cx="34" cy="54" r="23"></circle>
           <text class="node-initials" x="34" y="58">${escapeHtml(initialsFor(person))}</text>`;

      return `
        <g class="tree-node ${isSelected ? 'selected' : ''} ${deceased ? 'deceased' : ''}"
          data-person-id="${escapeHtml(person.id)}" tabindex="0" role="button"
          aria-label="${escapeHtml(name)}" transform="translate(${entry.x}, ${entry.y})">
          <rect class="node-card" width="216" height="114" rx="14"></rect>
          <path class="node-branch-accent" d="M 2 16 V 98"
            style="stroke:${entry.branchColor}"></path>
          ${photo}
          <text class="node-name" x="67" y="52" textLength="${nameLength}"
            lengthAdjust="spacingAndGlyphs">${escapeHtml(name)}</text>
          <text class="node-dates" x="67" y="73">${escapeHtml(dates || t('familyMember'))}</text>
          <text class="node-life-status" x="67" y="94">${deceased ? t('deceased') : t('living')}</text>
        </g>
      `;
    }).join('');
    return `<defs>${defs}</defs>${links}${nodeMarkup}`;
  }

  async function exportTreePdf() {
    if (!state.people.length) {
      alert(t('noMembers'));
      return;
    }
    if (dom.downloadPdfBtn?.disabled) return;

    if (dom.downloadPdfBtn) {
      dom.downloadPdfBtn.disabled = true;
      dom.downloadPdfBtn.setAttribute('aria-busy', 'true');
    }
    try {
      const { jsPDF } = await import('jspdf');
      const rootId = state.selectedPersonId || state.people[0]?.id;
      const layout = computeTreeLayout(state.people.map((person) => person.id), rootId);
      if (!layout.positions.length || layout.positions.length !== state.people.length) {
        throw new Error('The complete family tree could not be laid out.');
      }

      const margins = { horizontal: 16, vertical: 16 };
      const titleHeight = 20;
      const paperSizes = [
        ['a4', 297, 210],
        ['legal', 356, 216],
        ['tabloid', 432, 279],
        ['a3', 420, 297],
        ['a2', 594, 420],
        ['a1', 841, 594],
        ['a0', 1189, 841]
      ];
      const minReadableFontMm = 2.8;
      const minimumScale = minReadableFontMm / 13;
      const choosePage = ([format, width, height]) => {
        const contentWidth = width - margins.horizontal * 2;
        const contentHeight = height - margins.vertical * 2 - titleHeight;
        const scale = Math.min(
          contentWidth / layout.width,
          contentHeight / layout.height
        );
        return { format, width, height, contentWidth, contentHeight, scale };
      };
      let page = paperSizes
        .map(choosePage)
        .find((candidate) => candidate.scale >= minimumScale);
      if (!page) {
        const maximumPageSize = 5000;
        const scale = Math.min(
          0.35,
          (maximumPageSize - margins.horizontal * 2) / layout.width,
          (maximumPageSize - margins.vertical * 2 - titleHeight) / layout.height
        );
        const width = Math.min(
          maximumPageSize,
          layout.width * scale + margins.horizontal * 2
        );
        const height = Math.min(
          maximumPageSize,
          layout.height * scale + margins.vertical * 2 + titleHeight
        );
        page = choosePage(['custom', width, height]);
      }
      if (!(page.scale > 0) || !Number.isFinite(page.scale)) {
        throw new Error('The family tree is too large for a single PDF page.');
      }
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: page.format === 'custom'
          ? [page.width, page.height]
          : page.format,
        compress: true
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min(
        (pageWidth - margins.horizontal * 2) / layout.width,
        (pageHeight - margins.vertical * 2 - titleHeight) / layout.height
      );
      const renderedWidth = layout.width * scale;
      const renderedHeight = layout.height * scale;
      const imageX = (pageWidth - renderedWidth) / 2;
      const imageY = margins.vertical + titleHeight +
        (pageHeight - margins.vertical * 2 - titleHeight - renderedHeight) / 2;
      if (
        imageX < margins.horizontal ||
        imageX + renderedWidth > pageWidth - margins.horizontal ||
        imageY < margins.vertical + titleHeight ||
        imageY + renderedHeight > pageHeight - margins.vertical
      ) {
        throw new Error('The complete family tree does not fit on the PDF page.');
      }
      const titleDate = new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date());
      const baseSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      baseSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      baseSvg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
      baseSvg.setAttribute('width', layout.width);
      baseSvg.setAttribute('height', layout.height);
      baseSvg.innerHTML = treeSvgContent(layout);
      baseSvg.insertAdjacentHTML('afterbegin', `
        <style>
          .node-card{fill:#fff;stroke:#d9d5e8;stroke-width:1.25}
          .tree-node.deceased .node-card{fill:#f6f5f8}
          .tree-node text{font-family:"Segoe UI",Tahoma,sans-serif;font-size:12px;font-weight:normal}
          .node-name{fill:#242039;font-size:13px;font-weight:bold}
          .node-dates{fill:#656176;font-size:11px;font-weight:normal}
          .node-life-status{fill:#16835f;font-size:10px;font-weight:bold}
          .tree-node.deceased .node-life-status{fill:#766f80}
          .node-avatar-placeholder{fill:#eee8fb;stroke:#d8cdef;stroke-width:1}
          .node-initials{fill:#64449b;font-size:13px;font-weight:bold;text-anchor:middle}
          .node-branch-accent{fill:none;stroke-width:4;stroke-linecap:round}
          .tree-link{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
          .tree-link.spouse-link{stroke-width:2.5}
        </style>
      `);
      await makePdfImagesLocal(baseSvg);
      const imageDensity = Math.min(
        4,
        12000 / renderedWidth,
        12000 / renderedHeight,
        Math.sqrt(48000000 / (renderedWidth * renderedHeight))
      );
      const image = await renderSvgForPdf(
        baseSvg,
        renderedWidth * imageDensity,
        renderedHeight * imageDensity
      );

      pdf.setTextColor(35, 32, 57);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Courtesy of Md Injamam Ul Haque', margins.horizontal, margins.vertical + 4);
      pdf.setFontSize(13);
      pdf.text('Family Tree', margins.horizontal, margins.vertical + 11);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(95, 91, 108);
      pdf.text(titleDate, pageWidth - margins.horizontal, margins.vertical + 11, {
        align: 'right'
      });
      pdf.addImage(
        image,
        'PNG',
        imageX,
        imageY,
        renderedWidth,
        renderedHeight,
        undefined,
        'FAST'
      );
      if (pdf.internal.getNumberOfPages() !== 1) {
        throw new Error('The PDF export did not produce exactly one page.');
      }
      pdf.save(`family-tree-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Family tree PDF export failed.', error);
      alert(t('pdfExportFailed'));
    } finally {
      if (dom.downloadPdfBtn) {
        dom.downloadPdfBtn.disabled = false;
        dom.downloadPdfBtn.removeAttribute('aria-busy');
      }
    }
  }

  function renderFamilyTree() {
    if (!dom.treeSvg) {
      return;
    }

    const rootId =
      state.selectedPersonId ||
      state.people[0]?.id;

    if (!rootId) {
      if (dom.deleteSelectedBtn) dom.deleteSelectedBtn.disabled = true;
      dom.treeSvg.innerHTML =
        `<text x="20" y="20">${t(
          'treeEmpty'
        )}</text>`;
      if (dom.treeLegend) {
        dom.treeLegend.innerHTML = '';
        dom.treeLegend.hidden = true;
      }
      return;
    }
    if (dom.deleteSelectedBtn) dom.deleteSelectedBtn.disabled = false;

    const visibleIds =
      collectVisiblePeople(
        rootId,
        state.tree.maxDepth
      );
    const layout =
      computeTreeLayout(
        visibleIds,
        rootId
      );
    dom.treeSvg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    dom.treeSvg.setAttribute('width', layout.width);
    dom.treeSvg.setAttribute('height', layout.height);
    dom.treeSvg.innerHTML = treeSvgContent(layout, state.selectedPersonId);
    if (dom.treeLegend) {
      dom.treeLegend.innerHTML = `
        <span class="tree-legend-title">${escapeHtml(t('legendTitle'))}</span>
        ${layout.branches.map((branch) => `
          <span class="tree-legend-item">
            <span class="tree-legend-swatch" style="--branch-color:${branch.color}"></span>
            ${escapeHtml(branch.label)}
          </span>
        `).join('')}
        <span class="tree-legend-hint">${escapeHtml(t('branchColorHint'))}</span>
      `;
      dom.treeLegend.hidden = !layout.branches.length;
    }
    dom.treeSvg.style.transform =
      `translate(${state.tree.panX}px, ${state.tree.panY}px) scale(${state.tree.scale})`;

    dom.treeSvg
      .querySelectorAll(
        '.tree-node'
      )
      .forEach(
        (node) => {

          node.addEventListener(
            'click',
            () => {

              const personId =
                node.dataset
                  .personId;


              state.selectedPersonId =
                personId;

              renderProfilePanel();
              dom.profilePanel?.classList.remove('closed');
              renderFamilyTree();
            }
          );
          node.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              node.click();
            }
          });
        }
      );
  }


  function collectVisiblePeople(
    rootId,
    maxDepth
  ) {
    const peopleById = new Map(state.people.map((person) => [person.id, person]));
    const adjacency = new Map();
    const connect = (from, to, cost) => {
      if (!peopleById.has(from) || !peopleById.has(to) || from === to) return;
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push({ id: to, cost });
    };

    state.relationships.forEach((relation) => {
      if (relation.type === 'parentOf') {
        connect(relation.from, relation.to, 1);
        connect(relation.to, relation.from, 1);
      } else if (relation.type === 'spouseOf' || relation.type === 'siblingOf') {
        connect(relation.from, relation.to, 0);
        connect(relation.to, relation.from, 0);
      }
    });

    const distance = new Map([[rootId, 0]]);
    const queue = [rootId];
    for (let index = 0; index < queue.length; index += 1) {
      const currentId = queue[index];
      const currentDistance = distance.get(currentId);
      (adjacency.get(currentId) || []).forEach(({ id, cost }) => {
        const nextDistance = currentDistance + cost;
        if (nextDistance > maxDepth || (distance.has(id) && distance.get(id) <= nextDistance)) {
          return;
        }
        distance.set(id, nextDistance);
        queue.push(id);
      });
    }

    const visibleIds = new Set(distance.keys());
    state.people.forEach((person) => {
      const hasValidCoreRelationship = state.relationships.some((relation) =>
        ['parentOf', 'spouseOf', 'siblingOf'].includes(relation.type) &&
        peopleById.has(relation.from) &&
        peopleById.has(relation.to) &&
        (relation.from === person.id || relation.to === person.id)
      );
      if (!hasValidCoreRelationship) visibleIds.add(person.id);
    });
    return [...visibleIds];
  }


  function computeTreeLayout(
    visibleIds,
    rootId
  ) {
    const peopleById = new Map(state.people.map((person) => [person.id, person]));
    const visible = new Set(visibleIds.filter((id) => peopleById.has(id)));
    const units = new Map();
    const memberUnit = new Map();
    let nextUnitId = 0;

    const find = (id, parents) => {
      let root = id;
      while (parents.get(root) !== root) root = parents.get(root);
      while (parents.get(id) !== id) {
        const next = parents.get(id);
        parents.set(id, root);
        id = next;
      }
      return root;
    };
    const union = (first, second, parents) => {
      const firstRoot = find(first, parents);
      const secondRoot = find(second, parents);
      if (firstRoot !== secondRoot) parents.set(secondRoot, firstRoot);
    };
    const visibleSpouses = state.relationships.filter((relation) =>
      relation.type === 'spouseOf' &&
      visible.has(relation.from) &&
      visible.has(relation.to) &&
      relation.from !== relation.to &&
      !state.relationships.some((candidate) =>
        candidate.type === 'parentOf' &&
        ((candidate.from === relation.from && candidate.to === relation.to) ||
          (candidate.from === relation.to && candidate.to === relation.from))
      )
    );
    const spouseParent = new Map([...visible].map((id) => [id, id]));

    visibleSpouses.forEach((relation) => union(relation.from, relation.to, spouseParent));
    visible.forEach((id) => {
      const root = find(id, spouseParent);
      if (!units.has(root)) {
        units.set(root, { id: `unit-${nextUnitId++}`, members: [], parents: new Set(), children: new Set() });
      }
      const unit = units.get(root);
      unit.members.push(id);
      memberUnit.set(id, unit.id);
    });
    const genderOrder = { male: 0, female: 1, other: 2 };
    units.forEach((unit) => unit.members.sort((first, second) =>
      (genderOrder[peopleById.get(first).gender] ?? 2) -
        (genderOrder[peopleById.get(second).gender] ?? 2) ||
      String(first).localeCompare(String(second))
    ));

    const unitById = new Map([...units.values()].map((unit) => [unit.id, unit]));
    const generationParent = new Map([...unitById.keys()].map((id) => [id, id]));
    const generationChildren = new Map([...unitById.keys()].map((id) => [id, new Set()]));
    const acceptedParentEdges = [];
    visibleSpouses.forEach((relation) => {
      union(memberUnit.get(relation.from), memberUnit.get(relation.to), generationParent);
    });
    state.relationships.forEach((relation) => {
      if (relation.type === 'siblingOf' && visible.has(relation.from) && visible.has(relation.to)) {
        union(memberUnit.get(relation.from), memberUnit.get(relation.to), generationParent);
      }
    });
    const parentsByChild = new Map();
    state.relationships.forEach((relation) => {
      if (relation.type !== 'parentOf' || !visible.has(relation.from) || !visible.has(relation.to)) return;
      if (!parentsByChild.has(relation.to)) parentsByChild.set(relation.to, new Set());
      parentsByChild.get(relation.to).add(memberUnit.get(relation.from));
    });
    parentsByChild.forEach((parentUnits) => {
      const [firstParent, ...otherParents] = parentUnits;
      otherParents.forEach((parentUnit) => union(firstParent, parentUnit, generationParent));
    });
    const generationFind = (id) => find(id, generationParent);
    const reaches = (startId, targetId) => {
      const seen = new Set();
      const pending = [startId];
      while (pending.length) {
        const current = pending.pop();
        if (current === targetId) return true;
        if (seen.has(current)) continue;
        seen.add(current);
        (generationChildren.get(current) || []).forEach((childId) => pending.push(childId));
      }
      return false;
    };
    const parentRelationshipExists = (parentId, childId) =>
      state.relationships.some((relation) =>
        relation.type === 'parentOf' &&
        ((relation.from === parentId && relation.to === childId) ||
          (relation.from === childId && relation.to === parentId))
      );

    state.relationships.forEach((relation) => {
      if (!visible.has(relation.from) || !visible.has(relation.to)) return;
      if (relation.type === 'spouseOf' &&
          parentRelationshipExists(relation.from, relation.to)) return;
      if (relation.type === 'parentOf' && relation.from !== relation.to) {
        const parentUnitId = memberUnit.get(relation.from);
        const childUnitId = memberUnit.get(relation.to);
        if (!parentUnitId || !childUnitId || parentUnitId === childUnitId) return;
        const parentGenerationUnit = generationFind(parentUnitId);
        const childGenerationUnit = generationFind(childUnitId);
        if (parentGenerationUnit === childGenerationUnit) return;
        if (reaches(childGenerationUnit, parentGenerationUnit)) return;
        if (!generationChildren.get(parentGenerationUnit).has(childGenerationUnit)) {
          unitById.get(parentUnitId).children.add(childUnitId);
          unitById.get(childUnitId).parents.add(parentUnitId);
          generationChildren.get(parentGenerationUnit).add(childGenerationUnit);
        }
        if (!acceptedParentEdges.some((edge) => edge.from === relation.from && edge.to === relation.to)) {
          acceptedParentEdges.push({ from: relation.from, to: relation.to });
        }
      }
    });

    const generationUnits = [...new Set([...unitById.keys()].map(generationFind))];
    const indegree = new Map(generationUnits.map((id) => [id, 0]));
    generationChildren.forEach((children) => children.forEach((childId) => {
      indegree.set(childId, indegree.get(childId) + 1);
    }));
    const ready = generationUnits.filter((id) => indegree.get(id) === 0);
    const topological = [];
    for (let index = 0; index < ready.length; index += 1) {
      const unitId = ready[index];
      topological.push(unitId);
      generationChildren.get(unitId).forEach((childId) => {
        indegree.set(childId, indegree.get(childId) - 1);
        if (indegree.get(childId) === 0) ready.push(childId);
      });
    }

    const rootUnitId = memberUnit.get(rootId);
    const rootGenerationUnit = generationFind(rootUnitId);
    const generations = new Map();
    const generationParents = new Map(generationUnits.map((id) => [id, new Set()]));
    generationChildren.forEach((children, parentId) => children.forEach((childId) => {
      generationParents.get(childId).add(parentId);
    }));
    topological.forEach((unitId) => {
      const parentGeneration = [...generationParents.get(unitId)]
        .reduce((max, parentId) => Math.max(max, generations.get(parentId) + 1), 0);
      generations.set(unitId, parentGeneration);
    });
    const unitKey = (unitId) => unitById.get(unitId).members
      .slice()
      .sort()
      .join(':');
    const unitBranchColors = new Map();
    const rootUnits = generationUnits
      .filter((unitId) => generationParents.get(unitId).size === 0)
      .sort((first, second) => unitKey(first).localeCompare(unitKey(second)));
    rootUnits.forEach((unitId, index) => {
      unitBranchColors.set(unitId, {
        color: TREE_BRANCH_COLORS[index % TREE_BRANCH_COLORS.length],
        index
      });
    });
    topological.forEach((unitId) => {
      if (unitBranchColors.has(unitId)) return;
      const inherited = [...generationParents.get(unitId)]
        .map((parentId) => unitBranchColors.get(parentId))
        .filter(Boolean)
        .sort((first, second) => first.index - second.index)[0];
      if (inherited) {
        unitBranchColors.set(unitId, inherited);
      } else {
        const index = unitBranchColors.size;
        unitBranchColors.set(unitId, {
          color: TREE_BRANCH_COLORS[index % TREE_BRANCH_COLORS.length],
          index
        });
      }
    });
    const rootGeneration = generations.get(rootGenerationUnit) || 0;
    generations.forEach((generation, unitId) => generations.set(unitId, generation - rootGeneration));

    const layers = new Map();
    unitById.forEach((unit, unitId) => {
      unit.generation = generations.get(generationFind(unitId)) || 0;
      const generation = unit.generation;
      if (!layers.has(generation)) layers.set(generation, []);
      layers.get(generation).push(unitId);
    });
    const generationKeys = [...layers.keys()].sort((a, b) => a - b);
    const birthOrder = (unitId) => {
      const dates = unitById.get(unitId).members
        .map((id) => peopleById.get(id).birthDate)
        .filter(Boolean)
        .sort();
      return dates[0] || '';
    };
    const tieBreak = (first, second) => {
      const key = (unitId) => unitById.get(unitId).members
        .slice()
        .sort()
        .join(':');
      return birthOrder(first).localeCompare(birthOrder(second)) ||
        key(first).localeCompare(key(second));
    };
    const positionsInLayer = (generation) =>
      new Map(layers.get(generation).map((id, index) => [id, index]));

    generationKeys.forEach((generation) => layers.get(generation).sort(tieBreak));
    for (let pass = 0; pass < 6; pass += 1) {
      generationKeys.slice(1).forEach((generation, index) => {
        const previous = positionsInLayer(generationKeys[index]);
        layers.get(generation).sort((first, second) => {
          const barycenter = (unitId) => {
            const parents = [...unitById.get(unitId).parents]
              .map((parentId) => previous.get(parentId))
              .filter(Number.isFinite);
            return parents.length
              ? parents.reduce((sum, value) => sum + value, 0) / parents.length
              : Number.POSITIVE_INFINITY;
          };
          return barycenter(first) - barycenter(second) || tieBreak(first, second);
        });
      });
      generationKeys.slice(0, -1).reverse().forEach((generation, index) => {
        const next = positionsInLayer(generationKeys[generationKeys.length - index - 1]);
        layers.get(generation).sort((first, second) => {
          const barycenter = (unitId) => {
            const children = [...unitById.get(unitId).children]
              .map((childId) => next.get(childId))
              .filter(Number.isFinite);
            return children.length
              ? children.reduce((sum, value) => sum + value, 0) / children.length
              : Number.POSITIVE_INFINITY;
          };
          const firstCenter = barycenter(first);
          const secondCenter = barycenter(second);
          const firstIsRoot = first === rootUnitId ? 1 : 0;
          const secondIsRoot = second === rootUnitId ? 1 : 0;
          return secondIsRoot - firstIsRoot ||
            firstCenter - secondCenter ||
            tieBreak(first, second);
        });
      });
    }

    const cardWidth = 216;
    const cardHeight = 114;
    const partnerGap = 18;
    const unitGap = 64;
    const unitWidths = new Map([...unitById].map(([unitId, unit]) => [
      unitId,
      unit.members.length * cardWidth + Math.max(0, unit.members.length - 1) * partnerGap
    ]));
    const marginX = 48;
    const marginY = 48;
    const rowHeight = cardHeight + 112;
    const minGeneration = generationKeys[0] || 0;
    const positions = [];
    const unitCenters = new Map();
    const parentsByGeneration = new Map();
    acceptedParentEdges.forEach(({ from, to }) => {
      const parentUnitId = memberUnit.get(from);
      const childGenerationUnit = generationFind(memberUnit.get(to));
      if (!parentsByGeneration.has(childGenerationUnit)) {
        parentsByGeneration.set(childGenerationUnit, new Set());
      }
      parentsByGeneration.get(childGenerationUnit).add(parentUnitId);
    });

    generationKeys.forEach((generation) => {
      const families = new Map();
      layers.get(generation).forEach((unitId) => {
        const generationUnit = generationFind(unitId);
        const parents = [...(parentsByGeneration.get(generationUnit) || [])].sort();
        const key = parents.length
          ? parents.join('|')
          : `root:${generationUnit}`;
        if (!families.has(key)) {
          families.set(key, { parents, units: [], width: 0, target: 0 });
        }
        const family = families.get(key);
        family.units.push(unitId);
        family.width += unitWidths.get(unitId);
      });
      const familyGroups = [...families.values()];
      familyGroups.forEach((family) => {
        family.width += Math.max(0, family.units.length - 1) * unitGap;
        if (family.parents.length) {
          const centers = family.parents
            .map((parentId) => unitCenters.get(parentId))
            .filter(Number.isFinite);
          family.target = centers.length
            ? centers.reduce((sum, center) => sum + center, 0) / centers.length
            : 0;
        }
      });
      const rootFamilies = familyGroups.filter((family) => !family.parents.length);
      const rootWidth = rootFamilies.reduce((sum, family) => sum + family.width, 0) +
        Math.max(0, rootFamilies.length - 1) * unitGap;
      let rootCursor = -rootWidth / 2;
      rootFamilies.forEach((family) => {
        family.target = rootCursor + family.width / 2;
        rootCursor += family.width + unitGap;
      });
      familyGroups.sort((first, second) =>
        first.target - second.target ||
        first.units[0].localeCompare(second.units[0])
      );
      let previousRight = Number.NEGATIVE_INFINITY;
      familyGroups.forEach((family) => {
        let cursor = family.target - family.width / 2;
        if (cursor < previousRight + unitGap) cursor = previousRight + unitGap;
        family.units.forEach((unitId) => {
          const unit = unitById.get(unitId);
          const generationUnit = generationFind(unitId);
          const center = cursor + unitWidths.get(unitId) / 2;
          unitCenters.set(unitId, center);
          unit.members.forEach((id, memberIndex) => {
            const x = cursor + memberIndex * (cardWidth + partnerGap);
            const y = marginY + (generation - minGeneration) * rowHeight;
            const branch = unitBranchColors.get(generationUnit);
            positions.push({
              id,
              x,
              y,
              generation,
              branchColor: branch?.color || TREE_BRANCH_COLORS[0],
              branchIndex: branch?.index || 0
            });
          });
          cursor += unitWidths.get(unitId) + unitGap;
        });
        previousRight = cursor - unitGap;
      });
    });

    let minX = 0;
    let maxX = Number.NEGATIVE_INFINITY;
    positions.forEach((entry) => {
      minX = Math.min(minX, entry.x);
      maxX = Math.max(maxX, entry.x + cardWidth);
    });
    const horizontalShift = marginX - minX;
    positions.forEach((entry) => {
      entry.x += horizontalShift;
    });
    const positionById = new Map(positions.map((entry) => [entry.id, entry]));
    const links = [];
    const parentIdsByChild = new Map();
    acceptedParentEdges.forEach(({ from, to }) => {
      if (!parentIdsByChild.has(to)) parentIdsByChild.set(to, new Set());
      parentIdsByChild.get(to).add(from);
    });
    const childGroups = new Map();
    parentIdsByChild.forEach((parentSet, childId) => {
      const parentIds = [...parentSet].sort();
      const key = parentIds.join('|');
      if (!childGroups.has(key)) childGroups.set(key, { parentIds, childIds: [] });
      childGroups.get(key).childIds.push(childId);
    });
    childGroups.forEach(({ parentIds, childIds }) => {
      const parents = parentIds.map((id) => positionById.get(id)).filter(Boolean);
      const children = [...new Set(childIds)]
        .map((id) => positionById.get(id))
        .filter(Boolean);
      if (!parents.length || !children.length) return;
      const actualPartnership = visibleSpouses.find((relation) =>
        parentIds.includes(relation.from) && parentIds.includes(relation.to)
      );
      let anchorX;
      let anchorY;
      if (actualPartnership) {
        const first = positionById.get(actualPartnership.from);
        const second = positionById.get(actualPartnership.to);
        if (!first || !second || first.y !== second.y) return;
        const left = first.x < second.x ? first : second;
        const right = first.x < second.x ? second : first;
        anchorX = (left.x + cardWidth + right.x) / 2;
        anchorY = left.y + cardHeight / 2;
      } else if (parents.length === 1) {
        anchorX = parents[0].x + cardWidth / 2;
        anchorY = parents[0].y + cardHeight;
      } else {
        anchorX = parents.reduce(
          (sum, parent) => sum + parent.x + cardWidth / 2,
          0
        ) / parents.length;
        anchorY = Math.max(...parents.map((parent) => parent.y + cardHeight));
      }
      const childTop = Math.min(...children.map((child) => child.y));
      if (childTop <= anchorY) return;
      const childCenters = children.map((child) => child.x + cardWidth / 2);
      const color = unitBranchColors.get(
        generationFind(memberUnit.get(parentIds[0]))
      )?.color || TREE_BRANCH_COLORS[0];
      const childCenter = childCenters.reduce((sum, center) => sum + center, 0) /
        childCenters.length;
      const branchY = childTop - Math.min(36, (childTop - anchorY) / 2);
      const path = children.length === 1
        ? `M ${anchorX} ${anchorY} V ${branchY} H ${childCenter} V ${childTop}`
        : [
            `M ${anchorX} ${anchorY}`,
            `V ${branchY}`,
            `M ${Math.min(...childCenters)} ${branchY}`,
            `H ${Math.max(...childCenters)}`,
            ...children.map((child) =>
              `M ${child.x + cardWidth / 2} ${branchY} V ${child.y}`
            )
          ].join(' ');
      links.push({ type: 'parent', color, path });
    });

    visibleSpouses.forEach((relation) => {
      const first = positionById.get(relation.from);
      const second = positionById.get(relation.to);
      if (!first || !second || first.generation !== second.generation) return;
      const left = first.x < second.x ? first : second;
      const right = first.x < second.x ? second : first;
      if (left.x + cardWidth < right.x) {
        const y = left.y + cardHeight / 2;
        const color = unitBranchColors.get(
          generationFind(memberUnit.get(relation.from))
        )?.color || TREE_BRANCH_COLORS[0];
        links.push({
          type: 'spouse',
          color,
          path: `M ${left.x + cardWidth} ${y} H ${right.x}`
        });
      }
    });

    return {
      positions,
      links,
      branches: rootUnits.map((unitId, index) => ({
        label: `${t('branchLabel')} ${index + 1}`,
        color: unitBranchColors.get(unitId)?.color || TREE_BRANCH_COLORS[index % TREE_BRANCH_COLORS.length]
      })),
      width: maxX + horizontalShift + marginX,
      height: generationKeys.length * rowHeight - 112 + marginY * 2
    };
  }


  function openPrintableReport() {

    if (
      !state.people.length
    ) {

      alert(
        t('noMembers')
      );

      return;
    }


    const previousDepth =
      state.tree.maxDepth;


    state.tree.maxDepth =
      Math.max(
        previousDepth,
        state.people.length
      );


    renderFamilyTree();


    const treeSvg =
      dom.treeSvg.cloneNode(
        true
      );


    treeSvg.style.transform =
      'none';


    treeSvg.setAttribute(
      'width',
      '100%'
    );


    treeSvg.setAttribute(
      'height',
      'auto'
    );


    state.tree.maxDepth =
      previousDepth;


    renderFamilyTree();


    const relationRows =
      state.relationships
        .map(
          (relation) => {

            const from =
              getPersonById(
                relation.from
              );

            const to =
              getPersonById(
                relation.to
              );


            if (
              !from ||
              !to
            ) {
              return '';
            }


            const label =
              relation.role &&
              TRANSLATIONS.en[
                relation.role
              ]
                ? t(
                    relation.role
                  )
                : relation.type ===
                    'parentOf'
                  ? `${t(
                      'father'
                    )} / ${t(
                      'mother'
                    )}`
                  : relation.type ===
                      'spouseOf'
                    ? t(
                        'spouse'
                      )
                    : relation.type ===
                        'siblingOf'
                      ? `${t(
                          'brother'
                        )} / ${t(
                          'sister'
                        )}`
                      : t(
                          'relationshipLabel'
                        );


            return `
              <li>

                <strong>
                  ${escapeHtml(
                    getDisplayName(
                      from
                    )
                  )}
                </strong>

                —

                ${escapeHtml(
                  label
                )}

                —

                <strong>
                  ${escapeHtml(
                    getDisplayName(
                      to
                    )
                  )}
                </strong>

              </li>
            `;
          }
        )
        .filter(
          Boolean
        )
        .join('');


    const memberRows =
      state.people
        .map(
          (person) => `

            <li>

              <strong>
                ${escapeHtml(
                  getDisplayName(
                    person
                  )
                )}
              </strong>

              <span>
                ${escapeHtml(
                  t('gender')
                )}:
                ${escapeHtml(
                  t(
                    person.gender ||
                      'other'
                  )
                )}
                ·
                ${escapeHtml(
                  t(
                    'dateOfBirth'
                  )
                )}:
                ${escapeHtml(
                  person.birthDate ||
                    t('noData')
                )}
                ·
                ${escapeHtml(
                  t(
                    'dateOfDeath'
                  )
                )}:
                ${escapeHtml(
                  person.deathDate ||
                    t('noData')
                )}
              </span>

              <span>
                ${escapeHtml(
                  t('occupation')
                )}:
                ${escapeHtml(
                  person.occupation ||
                    t('noData')
                )}
                ·
                ${escapeHtml(
                  t('phone')
                )}:
                ${escapeHtml(
                  person.phone ||
                    t('noData')
                )}
                ·
                ${escapeHtml(
                  t('email')
                )}:
                ${escapeHtml(
                  person.email ||
                    t('noData')
                )}
              </span>

              <span>
                ${escapeHtml(
                  t('address')
                )}:
                ${escapeHtml(
                  person.address ||
                    t('noData')
                )}
              </span>

              <span>
                ${escapeHtml(
                  t('notes')
                )}:
                ${escapeHtml(
                  person.biography ||
                    t('noData')
                )}
              </span>

            </li>
          `
        )
        .join('');


    const exportedAt =
      new Intl.DateTimeFormat(
        'en-US',
        {
          dateStyle:
            'medium',

          timeStyle:
            'short'
        }
      ).format(
        new Date()
      );


    const report =
      document.getElementById(
        'print-report'
      );


    if (!report) {
      window.print();
      return;
    }


    report.setAttribute(
      'aria-hidden',
      'false'
    );


    report.innerHTML = `

      <h1>
        ${escapeHtml(
          t(
            'familyReport'
          )
        )}
      </h1>

      <p>
        ${escapeHtml(
          t(
            'exportDate'
          )
        )}:
        ${escapeHtml(
          exportedAt
        )}
      </p>


      <section>

        <h2>
          ${escapeHtml(
            t(
              'familyTree'
            )
          )}
        </h2>

        <div class="print-tree-svg">
          ${treeSvg.outerHTML}
        </div>

      </section>


      <section>

        <h2>
          ${escapeHtml(
            t(
              'familyMembers'
            )
          )}
          (${state.people.length})
        </h2>

        <ul class="print-members">
          ${memberRows}
        </ul>

      </section>


      <section>

        <h2>
          ${escapeHtml(
            t(
              'relationshipLabel'
            )
          )}
        </h2>

        <ul>

          ${
            relationRows ||
            `<li>${escapeHtml(
              t('noData')
            )}</li>`
          }

        </ul>

      </section>


      <footer>
        ${escapeHtml(
          t(
            'courtesy'
          )
        )}
      </footer>
    `;


    window.print();


    window.setTimeout(
      () =>
        report.setAttribute(
          'aria-hidden',
          'true'
        ),
      1000
    );
  }


  function escapeHtml(
    value
  ) {

    return String(
      value
    ).replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[
          character
        ]
    );
  }


  function getFilteredPeople() {

    const term =
      state.searchTerm;


    if (!term) {
      return [
        ...state.people
      ];
    }


    return state.people.filter(
      (person) => {

        const fullName =
          `${person.firstName} ${person.lastName}`
            .toLowerCase();


        const nickname =
          (
            person.nickname ||
            ''
          ).toLowerCase();


        return (
          fullName.includes(
            term
          ) ||
          nickname.includes(
            term
          ) ||
          getDisplayName(
            person
          )
            .toLowerCase()
            .includes(
              term
            )
        );
      }
    );
  }


  function getFamilyContext(
    personId
  ) {

    const parents = [];
    const children = [];
    const spouse = [];
    const siblings = [];
    const related = [];


    state.relationships.forEach(
      (relation) => {

        if (
          relation.type ===
          'parentOf'
        ) {

          if (
            relation.to ===
            personId
          ) {

            parents.push(
              getPersonById(
                relation.from
              )
            );
          }


          if (
            relation.from ===
            personId
          ) {

            children.push(
              getPersonById(
                relation.to
              )
            );
          }
        }


        if (
          relation.type ===
          'spouseOf'
        ) {

          if (
            relation.from ===
            personId
          ) {

            spouse.push(
              getPersonById(
                relation.to
              )
            );
          }


          if (
            relation.to ===
            personId
          ) {

            spouse.push(
              getPersonById(
                relation.from
              )
            );
          }
        }


        if (
          relation.type ===
          'siblingOf'
        ) {

          if (
            relation.from ===
            personId
          ) {

            siblings.push(
              getPersonById(
                relation.to
              )
            );
          }


          if (
            relation.to ===
            personId
          ) {

            siblings.push(
              getPersonById(
                relation.from
              )
            );
          }
        }


        if (
          relation.type ===
            'cousinOf' ||
          relation.type ===
            'otherRelativeOf' ||
          relation.type ===
            'uncleOf' ||
          relation.type ===
            'auntOf' ||
          relation.type ===
            'grandparentOf'
        ) {

          if (
            relation.to ===
            personId
          ) {

            related.push(
              getPersonById(
                relation.from
              )
            );
          }


          if (
            relation.from ===
            personId
          ) {

            related.push(
              getPersonById(
                relation.to
              )
            );
          }
        }
      }
    );


    return {

      parents:
        uniqById(
          parents.filter(
            Boolean
          )
        ),

      children:
        uniqById(
          children.filter(
            Boolean
          )
        ),

      spouse:
        uniqById(
          spouse.filter(
            Boolean
          )
        ),

      siblings:
        uniqById(
          siblings.filter(
            Boolean
          )
        ),

      related:
        uniqById(
          related.filter(
            Boolean
          )
        )
    };
  }


  function buildEventList() {

    return state.people

      .map(
        (person) => {

          const items = [];


          if (
            person.birthDate
          ) {

            items.push({

              year:
                new Date(
                  person.birthDate
                ).getFullYear(),

              title:
                `${getDisplayName(
                  person
                )} ${t(
                  'birthEvent'
                )}`,

              label:
                t('born'),

              dateLabel:
                person.birthDate,

              person:
                getDisplayName(
                  person
                ),

              color:
                '#5c3b9a'
            });
          }


          if (
            person.deathDate
          ) {

            items.push({

              year:
                new Date(
                  person.deathDate
                ).getFullYear(),

              title:
                `${getDisplayName(
                  person
                )} ${t(
                  'deathEvent'
                )}`,

              label:
                t('died'),

              dateLabel:
                person.deathDate,

              person:
                getDisplayName(
                  person
                ),

              color:
                '#d9465f'
            });
          }


          return items;
        }
      )

      .flat()

      .sort(
        (a, b) =>
          a.year -
          b.year
      );
  }


  function computeGenerationCount() {
    const root = state.people[0];
    if (!root) return 0;

    return new Set(
      computeTreeLayout(
        state.people.map((person) => person.id),
        root.id
      ).positions.map((entry) => entry.generation)
    ).size;
  }


  function getPersonById(
    personId
  ) {

    return (
      state.people.find(
        (person) =>
          person.id ===
          personId
      ) || null
    );
  }


  function uniqById(
    items
  ) {

    const seen =
      new Set();


    return items.filter(
      (item) => {

        if (
          !item ||
          !item.id
        ) {
          return false;
        }


        if (
          seen.has(
            item.id
          )
        ) {
          return false;
        }


        seen.add(
          item.id
        );


        return true;
      }
    );
  }


  function getDisplayName(
    person
  ) {

    if (!person) {
      return t(
        'unknownMember'
      );
    }


    const fullName =
      `${person.firstName || ''} ${person.lastName || ''}`
        .trim();


    return (
      fullName ||
      person.nickname ||
      t(
        'unknownMember'
      )
    );
  }


  function treeDateLabel(value) {
    if (!value) return '';
    const match = String(value).match(/\b\d{4}\b/);
    return match ? match[0] : String(value);
  }


  function initialsFor(
    person
  ) {

    return (
      person.firstName ||
      person.nickname ||
      'A'
    )
      .slice(
        0,
        2
      )
      .toUpperCase();
  }


  function deletePerson(
    personId
  ) {

    const person =
      getPersonById(
        personId
      );


    if (!person) {
      return;
    }


    const confirmed =
      window.confirm(
        `${t(
          'deleteConfirm'
        )} "${getDisplayName(
          person
        )}"`
      );


    if (!confirmed) {
      return;
    }


    state.people =
      state.people.filter(
        (entry) =>
          entry.id !==
          personId
      );


    state.relationships =
      state.relationships.filter(
        (relation) =>
          relation.from !==
            personId &&
          relation.to !==
            personId
      );


    state.selectedPersonId =
      state.people[0]?.id ||
      null;


    saveFamilyData();

    renderAll();

    closeProfilePanel();
  }


  function registerServiceWorker() {

    if (
      'serviceWorker' in
      navigator
    ) {

      window.addEventListener(
        'load',
        () => {

          navigator.serviceWorker
            .register(
              './service-worker.js'
            )
            .catch(
              (error) => {

                console.warn(
                  'Service worker registration failed:',
                  error
                );
              }
            );
        }
      );
    }
  }

})();