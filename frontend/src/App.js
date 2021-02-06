import React, { Component } from 'react'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom'

import Header from './components/Header/Header'
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation'
import ErrorHandler from './components/ErrorHandler/ErrorHandler'
import FeedPage from './pages/Feed/Feed'
import SinglePostPage from './pages/Feed/SinglePost/SinglePost'
import LoginPage from './pages/Auth/Login'
import SignupPage from './pages/Auth/Signup'
import './App.css'

class App extends Component {
  state = {
    isAuth: false,
    token: null,
    userId: null,
    authLoading: false,
    error: null,
  }

  componentDidMount() {
    const token = localStorage.getItem('token')
    const expiryDate = localStorage.getItem('expiryDate')
    if (!token || !expiryDate) {
      return
    }
    if (new Date(expiryDate) <= new Date()) {
      this.logoutHandler()
      return
    }
    const userId = localStorage.getItem('userId')
    const remainingMilliseconds =
      new Date(expiryDate).getTime() - new Date().getTime()
    this.setState({ isAuth: true, token: token, userId: userId })
    this.setAutoLogout(remainingMilliseconds)
  }

  logoutHandler = () => {
    this.setState({ isAuth: false, token: null })
    localStorage.removeItem('token')
    localStorage.removeItem('expiryDate')
    localStorage.removeItem('userId')
  }

  loginHandler = (event, authData) => {
    event.preventDefault()
    this.setState({ authLoading: true })

    const graphqlQuery = {
      query: `
        query UserLogin($email: String!, $password: String!){
          login(email: $email, password: $password) {
            token
            userId
          }
        }
      `,
      variables: {
        email: authData.email,
        password: authData.password,
      }
    }

    fetch(`${process.env.REACT_APP_SERVER_URI}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error('Validation failed. Make sure the email address is not used yet')
        }
        if (resData.errors) {
          throw new Error('Could not authenticate you!')
        }

        this.setState({
          isAuth: true,
          token: resData.data.login.token, 
          authLoading: false,
          userId: resData.data.login.userId,
        })
        localStorage.setItem('token', resData.data.login.token)
        localStorage.setItem('userId', resData.data.login.userId)
        const remainingMilliseconds = 60 * 60 * 1000
        const expiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        )
        localStorage.setItem('expiryDate', expiryDate.toISOString())
        this.setAutoLogout(remainingMilliseconds)
      })
      .catch((err) => {
        console.log(err)
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err,
        })
      })
  }

  signupHandler = (event, authData) => {
    event.preventDefault()
    this.setState({ authLoading: true })

    const graphqlQuery = {
      query: `
        mutation CreateNewUser($email: String!, $name: String!, $password: String!){
          createUser(userInput: { email: $email, name: $name, password: $password}){
            _id
            email
          }
        }
        `,
      variables: {
        email:authData.signupForm.email.value,
        name:authData.signupForm.name.value,
        password:authData.signupForm.password.value
      }
    }

    fetch(`${process.env.REACT_APP_SERVER_URI}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json()
      })
      .then((resData) => {

        if(resData.errors && resData.errors[0].status === 422 ){
          throw new Error('Validation failed. Make sure the email address is not used yet')
        }
        if(resData.errors){
          const errorMessage = resData.errors[0].message;
          throw new Error(errorMessage || 'User creation failed')
        }

        this.setState({ isAuth: false, authLoading: false })
        this.props.history.replace('/')
      })
      .catch((err) => {
        console.log(err)
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err,
        })
      })
  }

  setAutoLogout = (milliseconds) => {
    setTimeout(() => {
      this.logoutHandler()
    }, milliseconds)
  }

  errorHandler = () => {
    this.setState({ error: null })
  }

  render() {
    let routes = (
      <Switch>
        <Route
          path='/'
          exact
          render={(props) => (
            <LoginPage
              {...props}
              onLogin={this.loginHandler}
              loading={this.state.authLoading}
            />
          )}
        />
        <Route
          path='/signup'
          exact
          render={(props) => (
            <SignupPage
              {...props}
              onSignup={this.signupHandler}
              loading={this.state.authLoading}
            />
          )}
        />
        <Redirect to='/' />
      </Switch>
    )
    if (this.state.isAuth) {
      routes = (
        <Switch>
          <Route
            path='/'
            exact
            render={(props) => (
              <FeedPage userId={this.state.userId} token={this.state.token} />
            )}
          />
          <Route
            path='/:postId'
            render={(props) => (
              <SinglePostPage
                {...props}
                userId={this.state.userId}
                token={this.state.token}
              />
            )}
          />
          <Redirect to='/' />
        </Switch>
      )
    }
    return (
      <>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <Header>
          <MainNavigation
            onLogout={this.logoutHandler}
            isAuth={this.state.isAuth}
          />
        </Header>
        {routes}
      </>
    )
  }
}

export default withRouter(App)
