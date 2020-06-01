/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

const SinglePost = ({
  token,
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
    const graphqlQuery ={
      query:`
        query GetPost($id:Int!){
         getSinglePost(id:$id){
            title
            content
            imageUrl
            creator{
              name
            }
            createdAt
         }
      }
      `,
      variables: {
        id: postId
      }
    }
    async function FetchData() {
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer${' '}${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      })
        const resData = await res.json();

      if (resData.errors) {
           throw new Error('Failed to fetch single post')
         }

          setPostValues({
            title: resData.data.getSinglePost.title,
            author: resData.data.getSinglePost.name,
            image: `http://localhost:8080/${resData.data.getSinglePost.imageUrl}`,
            date: new Date(resData.data.getSinglePost.createdAt).toLocaleDateString('en-US'),
            content: resData.data.getSinglePost.content,
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
