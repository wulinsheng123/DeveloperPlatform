import { createStore } from 'vuex'

export default createStore({
  state: {
    baseUrlStrapi: 'http://localhost:1337',
    baseUrlStrapiApi: 'http://localhost:1337' + '/api/',
    strapiApiKey: '0dcd9dae2696b2a73a5be5e20b687ba8e2cd661cd2d1639fdefe8a3a787c6dff5a13d09ff08f1623f0a6ec4e57694e70c73caaa1deb58b29e1e59964025683afd56bc87538d8030d63467935c3e6ec9038b35664a405f417301bae12d2bb3c8fb50cc4d3186e5206d87e61905889416f727ca47b80ab88f6f007f716506120ab',
    selectedLinearGradient: {},
    name: "",
    profilepic: "",
    email: "",
    isLoggedIn: false,
    userObj: {},
    loggedInFirebaseUser: null,
    routings: {
      home: {
        path: '/',
        name: 'home',
        component: 'HomeView'
      },
      lineargradientgenerator: {
        path: '/LinearGradientGenerator',
        name: 'lineargradientgenerator',
        component: 'LinearGradientGeneratorView'
      },
      radialgradientgenerator: {
        path: '/RadialGradientGenerator',
        name: 'radialgradientgenerator',
        component: 'RadialGradientGeneratorView'
      },
      websitebuilder: {
        path: '/WebsiteBuilder',
        name: 'websitebuilder',
        component: 'WebsiteBuilderView'
      },
      domAnalyzer: {
        path: '/DOMAnalyzer',
        name: 'domanalyzer',
        component: 'DomAnalyzerView'
      },
      responsivityChecker: {
        path: '/ResponsivityChecker',
        name: 'responsivitychecker',
        component: 'ResponsivityCheckerView'
      },
      colorPalleteGenerator: {
        path: '/colorPalleteGenerator',
        name: 'colorpalletegenerator',
        component: 'ColorPalleteGeneratorView'
      }
    },
    userSavedColorPallets: [],
  },

  getters: {
  },
  mutations: {
    addColorPalletToSaved(state, colorPallet) {
      let newArr = [];
      if (state.userSavedColorPallets !== null) {
        for (let cp of state.userSavedColorPallets) {
          newArr.push(cp);
        }
      }
      else {
        state.userSavedColorPallets = [];
      }
      colorPallet = JSON.parse(colorPallet);
      newArr.push(colorPallet[0]);
      state.userSavedColorPallets = JSON.parse(JSON.stringify(newArr));
    },
    setUserSavedColorPallets(state, payload) {
      if (payload !== undefined) state.userSavedColorPallets = payload;
      console.log(state.userSavedColorPallets);
    },
    setSelectedLinearGradient(state, payload) {
      state.selectedLinearGradient = payload
    },
    setUserData(state, userdata) {
      state.name = userdata.user.displayName;
      state.profilepic = userdata.user.photoURL;
      state.email = userdata.user.email
      state.userObj = userdata.user.providerData[0];


      localStorage.setItem('userName', state.name);
      localStorage.setItem('profilePic', state.profilepic);
      localStorage.setItem('email', state.email);
      localStorage.setItem('uid', state.userObj.uid);
    },
    removeUserData(state) {
      state.name = "";
      state.profilepic = "";
      state.email = "";
      state.isLoggedIn = false;
      state.favoriteTools = [];

      localStorage.removeItem('userName');
      localStorage.removeItem('profilePic');
      localStorage.removeItem('email');
      localStorage.removeItem('uid');
      localStorage.removeItem('startScreenBackground');
    },
  },
  actions: {
    async ADD_COLORPALLETE_TO_ACCOUNT({ state, dispatch, commit }, user) {
      if (user === undefined) {
        return Promise.reject("Color Pallete is undefined");
      }

      commit('addColorPalletToSaved', user.colorPallet);
      console.log(state.userSavedColorPallets);
      if (state.userSavedColorPallets === undefined) {
        console.log("why is userSavedColorPallets undefined in ADD_COLORPALLETE_TO_ACCOUNT");
        return;
      }
      //find id of user with useruid
      const userId = await dispatch('GET_USER_ID', user.id);
      const rawResponse = await fetch(`${state.baseUrlStrapiApi}user-details/${userId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.strapiApiKey
        },
        body: JSON.stringify({ data: { colorpallet: state.userSavedColorPallets } })
      });
      const content = await rawResponse.json();
      console.log(content);
    },
    async CREATE_ACCOUNT({ state, dispatch, commit }, user) {
      if (!await dispatch('USER_EXISTS', user.uid)) {
        const rawResponse = await fetch(`${state.baseUrlStrapiApi}user-details`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + state.strapiApiKey
          },
          body: JSON.stringify({
            data: {
              userid: user.uid,
            }
          })
        });
        const content = await rawResponse.json();
        console.log(content);
      }
      commit("setUserData", { user: user });
      dispatch('LOAD_USER_SAVED_DATA', user.uid);
    },
    async USER_EXISTS({ state }, userId) {
      const dataResponse = await fetch(`${state.baseUrlStrapiApi}user-details?userid=${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.strapiApiKey
        }
      });
      const content2 = await dataResponse.json();
      console.log(content2)
      return content2.data.length > 0
    },
    async GET_USER_ID({ state }, userUid) {
      const dataResponse = await fetch(`${state.baseUrlStrapiApi}user-details?userid=${userUid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.strapiApiKey
        }
      });
      const content2 = await dataResponse.json();
      if (content2.data.length === 0) {
        return Promise.reject("User does not exist");
      }
      return content2.data[0].id;
    },
    async GET_USER_SAVED_COLOR_PALLETES({ state, dispatch, commit }, userUid) {
      if (userUid === undefined) {
        return Promise.reject("User uid is undefined");
      }
      const userId = await dispatch('GET_USER_ID', userUid);
      const dataResponse = await fetch(`${state.baseUrlStrapiApi}user-details/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.strapiApiKey
        }
      });
      const content2 = await dataResponse.json();
      commit("setUserSavedColorPallets", content2.data.attributes.colorpallet);
    },
    async LOAD_USER_SAVED_DATA({ dispatch }, uid) {
      dispatch('GET_USER_SAVED_COLOR_PALLETES', uid);
    },
  },
  modules: {
  }
})
