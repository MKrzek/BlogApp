/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

const SinglePost = ({
  match: {
    params: { postId },
  },
}) => {
  const [post, setPostValues] = useState({
    title: '',
    author: '',
    date: '',
    image: '',
    content: '',
  });

  useEffect(() => {
    async function FetchData() {
      await fetch(`http://localhost:8080/feed/post/${postId}`)
        .then(res => {
          if (res.status !== 200) {
            throw new Error('Failed to fetch status');
          }
          return res.json();
        })
        .then(resData => {

          setPostValues({
            title: resData.post.title,
            author: resData.post.name,
            image: `http://localhost:8080/${resData.post.imageUrl}`,
            date: new Date(resData.post.createdAt).toLocaleDateString('en-US'),
            content: resData.post.content,
          });
        });
    }

    FetchData();
  }, [postId]);

  const { title, date, author, image, content } = post;

  return (
    <section className="single-post">
      <h1>{title}</h1>
      <h2>
        Created by {author} on {date}
      </h2>
      <div className="single-post__image">
        <Image contain imageUrl={image} />
      </div>
      <p>{content}</p>
    </section>
  );
};

export default SinglePost;
