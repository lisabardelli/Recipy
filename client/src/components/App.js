import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "../App.css";

import RecipeList from "./recipes/RecipeList";
import IngredientList from "./ingredients/IngredientList";

import Navbar from "./layout/Navbar";
import Landing from "./layout/Landing";
import Register from "./auth/Register";
import Login from "./auth/Login";
import { Provider } from "react-redux";
import store from "../store";
import jwt_decode from "jwt-decode";
import setAuthToken from "../utils/setAuthToken";
import { setCurrentUser, logoutUser } from "../actions/authActions";
import PrivateRoute from "./private-route/PrivateRoute";
import Dashboard from "./dashboard/Dashboard";
import SpotifyLogin from "./spotify/login.js";
import SpotifyWebApi from "spotify-web-api-js";
import SpotifyPlayer from "react-spotify-web-playback";
var spotifyApi = new SpotifyWebApi();

// Check for token to keep user logged in
if (localStorage.jwtToken) {
  // Set auth token header auth
  const token = localStorage.jwtToken;
  setAuthToken(token);
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  // Set user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));
  // Check for expired token
  const currentTime = Date.now() / 1000; // to get in milliseconds
  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser());
    // Redirect to login
    window.location.href = "./login";
  }
}

const validateURI = (input: string): boolean => {
  let isValid = false;

  if (input && input.indexOf(':') > -1) {
    const [key, type, id] = input.split(':');

    if (key && type && type !== 'user' && id && id.length === 22) {
      isValid = true;
    }
  }

  return isValid;
};

const parseURIs = (input: string): string[] => {
  const ids = input.split(',');

  return ids.every((d) => validateURI(d)) ? ids : [];
};

function App() {
  const params = getHashParams();
  const token = params.access_token;
  const [loggedIn, setLoggedIn] = useState(token ? true : false);
  const [playlists, setPlaylists] = useState([]);
  const [URIs, setURIs] = useState(['spotify:album:51QBkcL7S3KYdXSSA0zM9R']);
  const URIsInput = useRef(null);

  if (token) {
    spotifyApi.setAccessToken(token);
  }

  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    e = r.exec(q);
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }

  const handleSubmitURIs = useCallback((e) => {
  e.preventDefault();

  if (URIsInput && URIsInput.current) {
    setURIs(URIsInput.current.value);
  }
}, []);

  const handleClickURIs = useCallback((e) => {
  e.preventDefault();
  const { uris } = e.currentTarget.dataset;

  setURIs(uris);

  if (URIsInput && URIsInput.current) {
    URIsInput.current.value = uris;
  }
  }, []);

  function getPlaylist() {
    spotifyApi
      .getUserPlaylists()
      .then((response) => {
        console.log("response: ", response);
        setPlaylists((prevPlaylist) => {
          return [
            ...prevPlaylist,
            response.items.map((playlist) => playlist.name),
          ];
        }); //an array
      })
      .catch((error) => {
        console.log(error);
      });
  }
  console.log("playlist state", playlists);
  // correct result
  // function getPlaylist(){
  //   spotifyApi.getUserPlaylists()
  //   .then((response) => {
  //     console.log('User playlists', response);
  //     console.log(response.items[0].name, response.items[0].id)
  //   })
  //   .catch((error) => {
  //     console.log(error)
  //   });
  // }

  const [ingredients, setIngredients] = useState({});
  const selectedIngredients = Object.values(ingredients).reduce(
    (selectedIngredients, next) => {
      // Loop through selected ingredients object to get all keys that have a truthy value
      const ingredientsSelected = Object.entries(next).reduce(
        (all, [key, value]) => {
          if (!value) return all;
          return [...all, key];
        },
        []
      );
      // Return all selected ingredient keys to use for filtering recipes
      return [...selectedIngredients, ...ingredientsSelected];
    },
    []
  );
  // Object.values ['value' 'value]
  // Object.keys ['key', 'key', 'key']
  // Object.entries [['key', 'value'], ['key', 'value]]
  console.log("selectedIngredients", selectedIngredients);
  console.log("playlists state: ", playlists);
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Navbar />
          <Route exact path="/" component={Landing} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/login" component={Login} />

          <Switch>
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
          </Switch>

          <div className="spotify">
            <SpotifyLogin />
            <SpotifyPlayer
              token={token}
              uris={URIs}
            />
            <div className="spotify-button">
              {loggedIn && (
                <button onClick={() => getPlaylist()}>Get My Playlists</button>
              )}
            </div>
            {playlists.map((name) => {
              return <div>{name}</div>;
            })}
          </div>
            <div className="playlist-buttons">

              <button onClick={handleClickURIs} data-uris="spotify:artist:7A0awCXkE1FtSU8B0qwOJQ">
              Play an Artist
              </button>
              <button onClick={handleClickURIs} data-uris="spotify:album:51QBkcL7S3KYdXSSA0zM9R">
              Play an Album
              </button>
              <button onClick={handleClickURIs} data-uris="spotify:playlist:0iuKmZRRdh8zvFjmMKWjFg">
              Play a Playlist
              </button>

            </div>

          <IngredientList
            ingredients={ingredients}
            setIngredients={setIngredients}
          />
          <RecipeList selectedIngredients={selectedIngredients} />
        </div>
      </Router>
    </Provider>
  );
}

export default App;

// all american 0gUutpl4Vqbbh9gHFKZwX1
// latin american 0iuKmZRRdh8zvFjmMKWjFg
