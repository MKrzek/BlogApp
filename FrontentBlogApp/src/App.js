import React, { useEffect, useState } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/FeedNew';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import './App.css';

const App = (props) => {

  const [showBackdrop, setShowBackdrop] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState(null)

  const logoutHandler = () => {
    setIsAuth(false)
    setToken(null)
    localStorage.removeItem('token');
    localStorage.removeItem('expiryDate');
    localStorage.removeItem('userId');
  };
  const setAutoLogout = milliseconds => {
    setTimeout(() => {
      logoutHandler();
    }, milliseconds);
  };


  useEffect(() => {
    // const token = localStorage.getItem('token');
    const expiryDate = localStorage.getItem('expiryDate');
    if (!token || !expiryDate) {
      return;
    }
    if (new Date(expiryDate) <= new Date()) {
      logoutHandler();
      return;
    }
    const remainingMilliseconds =
      new Date(expiryDate).getTime() - new Date().getTime();
    setIsAuth(true)

    setAutoLogout(remainingMilliseconds);
  }, [token, userId, isAuth, setIsAuth, logoutHandler, setAutoLogout])




  const mobileNavHandler = isOpen => {
    setShowMobileNav(isOpen)
    setShowBackdrop(isOpen)
  }

  const backdropClickHandler = () => {
    setShowBackdrop(false)
    setShowMobileNav(false)
    setError(null)
  };


  const loginHandler = async (event, { email, password }) => {
    event.preventDefault();
    setAuthLoading(true);
    const graphqlQuery = {
      query:`
        query Login($email: String!, $password:String!){
          login(email:$email, password:$password){
          token
          userId
        }

      }
      `,
      variables: {
        email,
        password
      }
    }
    try {

    const res = await fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify(graphqlQuery)
    })
      const resData = await res.json();

      if (resData.errors && resData.errors[0].status === 422) {
        throw new Error('Validation failed. Make sure the email address has not been used!')
      }
      if (resData.errors) {
        throw new Error('User login failed!')
      }
       const {login:{token, userId}} = resData.data
        setIsAuth(true)
        setToken(token)
        setAuthLoading(false)
        setUserId(userId)

        localStorage.setItem('token', token);
        localStorage.setItem('userId',userId);
        const remainingMilliseconds = 60 * 60 * 1000;
        const expiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        localStorage.setItem('expiryDate', expiryDate.toISOString());
        setAutoLogout(remainingMilliseconds);
      }
      catch(err ) {
        console.log(err);
        setIsAuth(false)
        setAuthLoading(false)
        setError(err)
      }
  };

  const signupHandler = async (event, { signupForm: { email, password, name } }) => {

    event.preventDefault();
    setAuthLoading(true);
    const graphqlQuery = {
      query: `
        mutation CreateUser($email:String!, $name:String!, $password: String!){
           createUser(
             userInput:
               { email:$email,
                 name:$name,
                 password:$password)
                {
          _id
          email
        }
      }
    `,
      variables: {
        email: email.value,
        name: name.value,
        password: password.value
      }
    }


  try {
    const res = await fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: { 'Content-Type': "application/json" },
      body: JSON.stringify(graphqlQuery )
    })

    const resData = await res.json();

    if (resData.errors && resData.errors[0].status === 422) {
      throw new Error('Validation failed. Make sure the email address has not been used!')
    }
    if (resData.errors) {
      throw new Error('User creation failed!')
    }
      setIsAuth(false)
      setAuthLoading(false)
      props.history.replace('/');
      }
      catch(err) {
        console.log(err);
        setIsAuth(false)
        setAuthLoading(false)
        setError(err)
      }
  };

  const errorHandler = () => {
    setError(null);
  };

  let routes = (
    <Switch>
      <Route
        path="/"
        exact
        render={props => (
          <LoginPage
            {...props}
            onLogin={loginHandler}
            loading={authLoading}
          />
        )}
      />
      <Route
        path="/signup"
        exact
        render={props => (
          <SignupPage
            {...props}
            onSignup={signupHandler}
            loading={authLoading}
          />
        )}
      />
      <Redirect to="/" />
    </Switch>
  );

  if (isAuth) {

    routes = (
      <Switch>
        <Route
          path="/"
          exact
          render={props => (
            token && <FeedPage userId={userId} token={token} />
          )}
        />
        <Route
          path="/:postId"
          render={props => (
            token && <SinglePostPage
              {...props}
              userId={userId}
              token={token}
            />
          )}
        />
        <Redirect to="/" />
      </Switch>
    );
  }
  return (
    <>
      {showBackdrop && (
        <Backdrop onClick={backdropClickHandler} />
      )}
      <ErrorHandler error={error} onHandle={errorHandler} />
      <Layout
        header={
          <Toolbar>
            <MainNavigation
              onOpenMobileNav={() => mobileNavHandler(true)}
              onLogout={logoutHandler}
              isAuth={isAuth}
            />
          </Toolbar>
        }
        mobileNav={
          <MobileNavigation
            open={showMobileNav}
            mobile
            onChooseItem={() => mobileNavHandler(false)}
            onLogout={logoutHandler}
            isAuth={isAuth}
          />
        }
      />
      {routes}
    </>
  );
}


export default withRouter(App);
