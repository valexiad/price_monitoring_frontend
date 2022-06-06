import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useHistory } from "react-router-dom";
import {ApiClient, AuthApi, Login} from 'price_monitoring_service'

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
  const PRICE_MONITORING_URL = process.env.REACT_APP_PRICE_MONITORING_URL;
  
  let apiClient = new ApiClient();
  apiClient.basePath = PRICE_MONITORING_URL;
  let apiInstance = new AuthApi(apiClient);

  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null
  );
  const [loading, setLoading] = useState(true);

  const history = useHistory();

  const loginUser = async (username, password) => {
    let body = new Login();
    body.email = username;
    body.password = password;

    apiInstance.authLoginCreate(body, (error, data, response) => {
      if (error) {
        console.error(error);
      } else {
        let authTokens = {
          'access': data.access,
          'refresh': data.refresh,
        };
        setAuthTokens(authTokens);

        let user = data.user;
        setUser(user);

        localStorage.setItem("authTokens", JSON.stringify(authTokens));
        localStorage.setItem("userInfo", JSON.stringify(user));
        history.push("/");
      }
    });
  };
  
  const registerUser = async (username, password, password2) => {
    const response = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password,
        password2
      })
    });
    if (response.status === 201) {
      history.push("/login");
    } else {
      alert("Something went wrong!");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    history.push("/");
  };

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
    registerUser,
    loginUser,
    logoutUser
  };

  useEffect(() => {
    if (authTokens) {
      setUser(jwt_decode(authTokens.access));
    }
    setLoading(false);
  }, [authTokens, loading]);

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};