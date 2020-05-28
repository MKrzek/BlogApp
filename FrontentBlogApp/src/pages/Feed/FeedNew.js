import React, { useEffect, useState, useCallback } from 'react';
import openSocket from 'socket.io-client'
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
      try {
        const res = await fetch(`http://localhost:8080/feed/posts?page=${page}`, {
          headers: {
            Authorization: `Bearer${' '}${token}`
          }
        })

        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        const resData = await res.json();

  setPosts(prevState => resData.posts.map(post => ({ ...post, imageUrl: post.imageUrl })));
  setTotalPosts(resData.totalItems);
  setPostsLoading(false);
}
catch(err){catchError()}
    },
    [token, postPage, totalPosts, postsLoading, setPosts, setTotalPosts, setPostsLoading, setPostPage, postPage, setError,]
  );
   //websocket actions
  const addPost = useCallback(post => {
    setPosts(prevState => {
      const updatedPosts = [...prevState]
      if (postPage === 1) {
        if (posts.length >= 2) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post)
      }
      setTotalPosts(prevState => prevState + 1)
      return updatedPosts
    })
    return {
      posts,
      totalPosts
    }
  }, [posts, totalPosts, setPosts, setTotalPosts])

  const updatePosts = useCallback(post => {
    setPosts(prevState => {
      const updatedPosts = [...prevState]
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id)
      if (updatedPostIndex > -1) {
         updatedPosts[updatedPostIndex] = post
      }
      return updatedPosts
    })
    return {posts}
  }, [posts, setPosts])

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

    //websocket setup
    const socket = openSocket('http://localhost:8080')
    socket.on('posts', data => {
      console.log('data', data)
      if (data.action === "create") {
        addPost(data.post)
      }
      else if (data.action === 'update') {
        updatePosts(data.post)
      } else if (data.action === 'delete') {
        loadPosts()
      }
    })
  }, [token,openSocket]);



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


    setEditLoading(true);
    // Set up data (with image!)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('image', image)
    console.log('edit-state', editPost)
    let url = 'http://localhost:8080/feed/post';
    let method = 'POST';
    if (editPost) {
      url = `http://localhost:8080/feed/post/${editPost._id}`;
      method = "PUT"
    }
    try{
    const res = await fetch(url, {
      method,
      body: formData,
      headers: {
        Authorization: `Bearer${' '}${token}`
      }
    })
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        const resData = await  res.json();

        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          image: resData.post.imageUrl,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt,
        };


        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);

          return {
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
