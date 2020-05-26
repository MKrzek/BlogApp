import React, { useEffect, useState, useCallback } from 'react';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEditNew';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

const Feed = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalposts] = useState(0);
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
      await fetch('http://localhost:8080/feed/posts')
        .then(res => {
          if (res.status !== 200) {
            throw new Error('Failed to fetch posts.');
          }
          return res.json();
        })
        .then(resData => {
          console.log('resssss-fronted', resData.posts);
          setPosts(()=>resData.posts.map(post=>({...post, imageUrl: post.imageUrl})));
          setTotalposts(resData.posts.length);
          setPostsLoading(false);

        })
        .catch(catchError)
    },
    [postPage, totalPosts]
  );

  useEffect(() => {
    async function fetchData() {
      await fetch('URL')
        .then(res => {
          if (res.status !== 200) {
            throw new Error('Failed to fetch user status.');
          }
          return res.json();

        })
        .then(resData => {
          setStatus(resData.status);
        })
        .catch(catchError);
    }
    loadPosts()
    fetchData();
  }, []);

  const statusUpdateHandler = event => {
    event.preventDefault();
    fetch('URL')
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
      })
      .catch(catchError);
  };

  const newPostHandler = () => {
    setIsEditing(true);
  };

  const startEditPostHandler = postId => {
    console.log('postId', postId);
    console.log('posts-in start', posts);

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

  const finishEditHandler = ({ title, content, image }) => {


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

    fetch(url, {
      method,
      body: formData,
    })
      .then(res => {


        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log('edited-from-backend ', resData);
        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          image: resData.post.imageUrl,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt,
        };

        let updatedPosts
        setPosts(prevState => {
           updatedPosts = [...prevState];
          if (editPost) {
            const postIndex = prevState.findIndex(p => p._id === editPost._id);

            updatedPosts[postIndex] = post;

          } else  {
            updatedPosts = prevState.concat(post);
          }
          return updatedPosts
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

      })
      .catch(err => {
        console.log(err);
        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);
        setError(err);
      });
  };

  const statusInputChangeHandler = (input, value) => {
    setStatus(value);
  };

  const deletePostHandler = postId => {
    setPostsLoading(true);
    fetch(`http://localhost:8080/feed/post/${postId}`, { method:"DELETE"})
      .then(res => {
        console.log('resssss-after-delete', res)
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log('rrssss-deleteing', resData);
        setPosts(prevState => prevState.filter(p => p._id !== postId)
        );
        setPostsLoading(false);
        return { posts, postsLoading };
      })
      .catch(err => {
        console.log(err);
        setPostsLoading(false);
      });
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
