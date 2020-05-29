import React, { useEffect, useState, useCallback } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEditNew';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

const Feed = ({ token }) => {

  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [editPost, setEditPost] = useState('');
  const [status, setStatus] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);


  const catchError = error => {
    setError(error);
  };

  const loadPosts = useCallback(
    async direction => {
      if (direction) {
        setPostsLoading(true);
        setPosts([]);
      }
      let page = postPage;
      if (direction === 'next') {
        page++;
        setPostPage(page);
      }
      if (direction === 'previous') {
        page--;
        setPostPage(page);
      }
      const graphqlQuery = {
        query: `
          {
            getPosts{
              posts{
                  _id
                  title
                  content
                  imageUrl
                  creator{
                    name
                  }
                  createdAt
              }
              totalPosts
            }
          }
        `
      }
      try {
        const res = await fetch(`http://localhost:8080/graphql`, {
          method:"POST",
          headers: {
            Authorization: `Bearer${' '}${token}`,
            'Content-Type': "application/json"

          },
          body: JSON.stringify(graphqlQuery)
        })
        const resData = await res.json();
        if (resData.errors) {
          throw new Error('Could not get posts')
        }

  setPosts(prevState => resData.data.getPosts.posts.map(post => ({ ...post, imageUrl: post.imageUrl })));
  setTotalPosts(resData.data.getPosts.totalPosts);
  setPostsLoading(false);
}
catch(err){catchError()}
    },
    [token, postPage, totalPosts, postsLoading, setPosts, setTotalPosts, setPostsLoading, setPostPage, postPage, setError,]
  );


  useEffect(() => {
    async function fetchData() {
      await fetch('http://localhost:8080/auth/status', {
        headers: {
          Authorization: `Bearer${' '}${token}`
        }})
        .then(res => {
          if (res.status !== 200) {
            throw new Error('Failed to fetch user status.');
          }
          return res.json();

        })
        .then(resData => {
          console.log('status', resData)
          setStatus(resData.status);
        })
        .catch(catchError);
    }
    loadPosts()
    fetchData();


  }, [token]);



  const statusUpdateHandler = async event => {

    event.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/auth/status', {
        method: "PUT",
        headers: {
          'Content-Type': "application/json",
          Authorization: `Bearer${' '}${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.status !== 200 && res.status !== 201) {
        throw new Error("Can't update status!");
      }
      const resData = await res.json();
      console.log(resData);
    }
      catch (err) { catchError() }
  }

  const newPostHandler = () => {
    setIsEditing(true);
  };

  const startEditPostHandler = postId => {

    setEditPost(prevState => ({...posts.find(p => p._id === postId) }
      ))
    setIsEditing(true);
    setPosts(posts)
    return {
      isEditing,
      editPost,
      posts
    };
  };

  const cancelEditHandler = () => {
    setIsEditing(false);

    setEditPost(null);
  };

  const finishEditHandler = async ({ title, content, image }) => {
    console.log('ssssss', title, content, image)
    setEditLoading(true);
    // Set up data (with image!)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('image', image)
    console.log('edit-state', editPost)

    let graphqlQuery = {
      query: `
        mutation{createPost(postInput:
          {title:"${title}",
           content:"${content}",
           imageUrl:"someURL"}){
          _id
          title
          content
          imageUrl
          creator {
            name
          }
          createdAt
        }
      }
      `
    }
    try{
    const res = await fetch('http://localhost:8080/graphql', {
      method:"POST",
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: `Bearer${' '}${token}`,
        'Content-Type': 'application/json'
      }
    })
      const resData = await res.json();
      console.log('resData-created-post', resData)

      if (resData.errors && resData.errors[0].status === 422) {
        throw new Error('Validation failed. Make sure the email address has not been used!')
      }
      if (resData.errors) {
        throw new Error('Something went wrong when creating the post!')
      }

        const post = {
          _id: resData.data.createPost._id,
          title: resData.data.createPost.title,
          image: resData.data.createPost.imageUrl,
          content: resData.data.createPost.content,
          creator: resData.data.createPost.creator,
          createdAt: resData.data.createPost.createdAt,
        };
      setPosts(prevState => {
        const updatedState = [...prevState]
        if (editPost) {
          const postIndex = prevState.findIndex(p => p._id === editPost._id)
          updatedState[postIndex] = post
        } else {
          updatedState.unshift(post)
        }
        return updatedState
        })
        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);

      return {
            posts,
            isEditing,
            editPost,
            editLoading,
          };
      }
      catch(err) {
        console.log(err);
        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);
        setError(err);
      }
  };

  const statusInputChangeHandler = (input, value) => {
    console.log('status', value)
    setStatus(value);
  };

  const deletePostHandler = async postId => {
    setPostsLoading(true);
    try{
    const res = await fetch(`http://localhost:8080/feed/post/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer${' '}${token}`
      }})
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
      const resData = await res.json();
      loadPosts()

      }
      catch(err) {
        console.log(err);
        setPostsLoading(false);
      };
  };

  const errorHandler = () => {
    setError(null);
  };

  return (
    <>
      <ErrorHandler error={error} onHandle={errorHandler} />
      <FeedEdit
        editing={isEditing}
        selectedPost={editPost}
        loading={editLoading}
        onCancelEdit={cancelEditHandler}
        onFinishEdit={finishEditHandler}
      />
      <section className="feed__status">
        <form onSubmit={statusUpdateHandler}>
          <Input
            type="text"
            placeholder="Your status"
            control="input"
            onChange={statusInputChangeHandler}
            value={status}
          />
          <Button mode="flat" type="submit">
            Update
            </Button>
        </form>
      </section>
      <section className="feed__control">
        <Button mode="raised" design="accent" onClick={newPostHandler}>
          New Post
          </Button>
      </section>
      <section className="feed">
        {postsLoading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Loader />
          </div>
        )}
        {console.log('posts', posts)}
        {posts.length <= 0 && !postsLoading ? (
          <p style={{ textAlign: 'center' }}>No posts found.</p>
        ) : null}

      {!postsLoading && (
        <Paginator
          onPrevious={()=>loadPosts('previous')}
          onNext={()=>loadPosts('next')}
          lastPage={Math.ceil(totalPosts / 2)}
          currentPage={postPage}
          >

      {posts.map(post => <Post
        key={post._id}
        id={post._id}
        author={post.creator.name}
        date={new Date(post.createdAt).toLocaleDateString('en-US')}
        title={post.title}
        image={post.imageUrl}
        content={post.content}
        onStartEdit={()=>startEditPostHandler(post._id)}
        onDelete={()=>deletePostHandler(post._id)}
      />
          )}
        </Paginator>
        )}
        </section>
    </>
  )
}
export default Feed;
