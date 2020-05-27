import React, { useEffect, useState } from 'react';

import Backdrop from '../../Backdrop/Backdrop';
import Modal from '../../Modal/Modal';
import Input from '../../Form/Input/Input';
import FilePicker from '../../Form/Input/FilePicker';
import Image from '../../Image/Image';
import { required, length } from '../../../util/validators';
import { generateBase64FromImage } from '../../../util/image';
import usePrevious from "../../../hooks/usePrevious"
import isEqual from 'lodash.isequal'

const POST_FORM = {
    title: {
        value: '',
        valid: false,
        touched: false,
        validators: [required, length({ min: 5 })]
    },
    image: {
        value: '',
        valid: false,
        touched: false,
        validators: [required]
    },
    content: {
        value: '',
        valid: false,
        touched: false,
        validators: [required, length({ min: 5 })]
    }
};

const FeedEdit = ({ onFinishEdit, editing, selectedPost, onCancelEdit,loading }) => {

    const [postForm, setPostForm] = useState(POST_FORM)
    const [formIsValid, setFormIsValid] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const previousStateEdting = usePrevious(editing)
    const previousSelectedPost = usePrevious(selectedPost)


    useEffect(() => {
        if ((selectedPost && (!isEqual(previousStateEdting, editing)))
             &&
            (selectedPost && (!isEqual(previousSelectedPost, selectedPost)))
        )
        {
           const x = {
                title: {
                    ...postForm.title,
                    value:  selectedPost.title,
                    valid: true
                },
                image: {
                    ...postForm.image,
                    value: selectedPost.imagePath,
                    valid: true
                },
                content: {
                    ...postForm.content,
                    value: selectedPost.content,
                    valid: true
                }
            }
            ;
            setPostForm(x);
            setFormIsValid(true)
        }

   },[postForm, setPostForm, setFormIsValid, formIsValid, selectedPost, editing])

    const postInputChangeHandler = (input, value, files) => {
        if (files) {
            generateBase64FromImage(files[0])
                .then(b64 => {
                    setImagePreview(b64);
                })
                .catch(e => {
                    setImagePreview(null);
                });
        }
        let formIsValid = true;
        let updatedForm
        setPostForm(prevState => {

            let isValid = true;
            for (const validator of prevState[input].validators) {
                isValid = isValid && validator(value);
            }
            updatedForm = {
                ...prevState,
                [input]: {
                    ...prevState[input],
                    valid: isValid,
                    value: files ? files[0] : value
                }

            };

            for (const inputName in updatedForm) {
                formIsValid = formIsValid && updatedForm[inputName].valid;
            }

            return updatedForm
          })
        setFormIsValid(formIsValid)

        return {formIsValid}


    };

    const inputBlurHandler = input => {
        setPostForm(prevState => {
            return {
                    ...prevState,
                    [input]: {
                        ...prevState[input],
                        touched: true
                    }

            };
        });
    };

    const cancelPostChangeHandler = () => {
        setPostForm(POST_FORM)
        setFormIsValid(false)

        onCancelEdit();
    };

    const acceptPostChangeHandler = () => {
        const post = {
            title: postForm.title.value,
            image: postForm.image.value,
            content: postForm.content.value
        };
        onFinishEdit(post);
        setPostForm(POST_FORM)
        setFormIsValid(false)
        setImagePreview(null)
    };

    return (editing ? (
        <>
            <Backdrop onClick={cancelPostChangeHandler} />
            <Modal
                title={editing? 'Edit Post': 'New Post'}
                acceptEnabled={formIsValid}
                onCancelModal={cancelPostChangeHandler}
                onAcceptModal={acceptPostChangeHandler}
                isLoading={loading}
            >

                <form>
                    <Input
                        id="title"
                        label="Title"
                        control="input"
                        onChange={postInputChangeHandler}
                        onBlur={()=>inputBlurHandler( 'title')}
                        valid={postForm['title'].valid}
                        touched={postForm['title'].touched}
                        value={postForm['title'].value}
                    />
                    <FilePicker
                        id="image"
                        label="Image"
                        control="input"
                        onChange={postInputChangeHandler}
                        onBlur={() => inputBlurHandler('image')}
                        valid={postForm['image'].valid}
                        touched={postForm['image'].touched}
                    />
                    <div className="new-post__preview-image">
                        {!imagePreview && <p>Please choose an image.</p>}
                        {imagePreview && (
                            <Image imageUrl={imagePreview} contain left />
                        )}
                    </div>
                    <Input
                        id="content"
                        label="Content"
                        control="textarea"
                        rows="5"
                        onChange={postInputChangeHandler}
                        onBlur={()=>inputBlurHandler( 'content')}
                        valid={postForm['content'].valid}
                        touched={postForm['content'].touched}
                        value={postForm['content'].value}
                    />
                </form>
            </Modal>
        </>
    ) : null
    )
}

export default FeedEdit;
