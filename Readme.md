# The Thought Trail - Backend Documentation

## Project Overview

**The Thought Trail** is a full-stack blogging platform built using the MERN stack (MongoDB, Express, React, and Node.js). The application allows users to write, view, and interact with blogs. It supports user authentication via email and Google (Firebase integration) and features functionalities such as trending blogs, tagging, and search. Users have profile and dashboard pages where they can manage their blogs and personal information.

The platform includes a rich text editor for blogs with image upload functionality via an AWS S3 bucket and has a dark and light theme toggle.

---

## Backend Documentation

### Technologies Used

- **Node.js**: Backend runtime environment
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **Firebase Admin SDK**: For Google authentication
- **AWS SDK**: For AWS S3 file storage
- **JWT**: For secure user authentication

---

### Folder Structure

- **Schema/**: Contains Mongoose models for blogs, comments, notifications, and users.
- **server.js**: Entry point for the backend server.
- **package.json**: Contains the project dependencies and scripts.

---

### Required Environment Variables

The backend requires several environment variables to function correctly, stored in a `.env` file:

- `DB_LOCATION`: MongoDB connection URI.
- `SECRET_ACCESS_KEY`: JWT secret key for user authentication.
- `AWS_ACCESS_KEY`: AWS access key for S3 bucket integration.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for S3.
- `AWS_BUCKET_NAME`: The name of the AWS S3 bucket used for storing blog images.
- `AWS_BUCKET_REGION`: AWS S3 bucket region.
- `AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = 1`: Suppresses AWS SDK maintenance messages.
- **Firebase Admin** credentials for Google login:
  - A Firebase service account file must be imported and named correctly in the `server.js` file.

---

### MongoDB Schemas

#### 1. Blog Schema (`Schema/Blog.js`)

The **Blog** schema represents the core blogging content created by users.

```javascript
const blogSchema = mongoose.Schema({
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    banner: { type: String },
    des: { type: String, maxlength: 200 },
    content: { type: [], required: true },
    tags: { type: [String], required: true },
    author: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    activity: {
        total_likes: { type: Number, default: 0 },
        total_comments: { type: Number, default: 0 },
        total_reads: { type: Number, default: 0 },
        total_parent_comments: { type: Number, default: 0 },
    },
    comments: [{ type: Schema.Types.ObjectId, ref: 'comments' }],
    draft: { type: Boolean, default: false },
}, {
    timestamps: { createdAt: 'publishedAt' }
});
```

- **Fields**:
  - `blog_id`: Unique identifier for the blog.
  - `title`: Title of the blog.
  - `banner`: URL for the blog's banner image.
  - `des`: Short description of the blog (max length 200).
  - `content`: Main body of the blog (array type for structured content).
  - `tags`: Array of tags used for blog categorization.
  - `author`: Reference to the user who created the blog.
  - `activity`: Track engagement with the blog (likes, comments, reads).
  - `comments`: Array of comment IDs associated with the blog.
  - `draft`: Boolean indicating whether the blog is a draft.
  - `timestamps`: Automatically stores the creation time as `publishedAt`.

---

#### 2. Comment Schema (`Schema/Comment.js`)

The **Comment** schema models the user comments made on blogs.

```javascript
const commentSchema = mongoose.Schema({
    blog_id: { type: Schema.Types.ObjectId, required: true, ref: 'blogs' },
    blog_author: { type: Schema.Types.ObjectId, required: true, ref: 'blogs' },
    comment: { type: String, required: true },
    children: [{ type: Schema.Types.ObjectId, ref: 'comments' }],
    commented_by: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    isReply: { type: Boolean, default: false },
    parent: { type: Schema.Types.ObjectId, ref: 'comments' },
}, {
    timestamps: { createdAt: 'commentedAt' }
});
```

- **Fields**:
  - `blog_id`: The ID of the blog the comment belongs to.
  - `blog_author`: Reference to the blog's author.
  - `comment`: The content of the comment.
  - `children`: Array of replies to the comment.
  - `commented_by`: Reference to the user who made the comment.
  - `isReply`: Boolean indicating if the comment is a reply to another comment.
  - `parent`: ID of the parent comment if it is a reply.
  - `timestamps`: Automatically stores the creation time as `commentedAt`.

---

#### 3. Notification Schema (`Schema/Notification.js`)

The **Notification** schema stores notifications related to user interactions (e.g., likes, comments).

```javascript
const notificationSchema = mongoose.Schema({
    type: { type: String, enum: ["like", "comment", "reply"], required: true },
    blog: { type: Schema.Types.ObjectId, required: true, ref: 'blogs' },
    notification_for: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    comment: { type: Schema.Types.ObjectId, ref: 'comments' },
    reply: { type: Schema.Types.ObjectId, ref: 'comments' },
    replied_on_comment: { type: Schema.Types.ObjectId, ref: 'comments' },
    seen: { type: Boolean, default: false }
}, {
    timestamps: true
});
```

- **Fields**:
  - `type`: Type of notification (like, comment, reply).
  - `blog`: Reference to the blog where the interaction occurred.
  - `notification_for`: User who receives the notification.
  - `user`: The user responsible for the action (e.g., who liked/commented).
  - `comment`, `reply`, `replied_on_comment`: IDs for related comment interactions.
  - `seen`: Boolean to indicate if the notification has been viewed.

---

Here’s the Markdown documentation for the **User Schema** and **server.js** you can copy and paste:

---

#### 4. User Schema (`Schema/User.js`)

The **User** schema represents the core data of users in the Thought Trail platform, including personal information, social links, and account statistics.

```javascript
import mongoose, { Schema } from "mongoose";

let profile_imgs_name_list = ["Garfield", "Tinkerbell", "Annie", "Loki", "Cleo", "Angel", "Bob", "Mia", "Coco", "Gracie", "Bear", "Bella", "Abby", "Harley", "Cali", "Leo", "Luna", "Jack", "Felix", "Kiki"];
let profile_imgs_collections_list = ["notionists-neutral", "adventurer-neutral", "fun-emoji"];

const userSchema = mongoose.Schema({

    personal_info: {
        fullname: {
            type: String,
            lowercase: true,
            required: true,
            minlength: [3, 'fullname must be 3 letters long'],
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },
        password: String,
        username: {
            type: String,
            minlength: [3, 'Username must be 3 letters long'],
            unique: true,
        },
        bio: {
            type: String,
            maxlength: [200, 'Bio should not be more than 200'],
            default: "",
        },
        profile_img: {
            type: String,
            default: () => {
                return `https://api.dicebear.com/6.x/${profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)]}/svg?seed=${profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]}`
            }
        },
    },
    social_links: {
        youtube: {
            type: String,
            default: "",
        },
        instagram: {
            type: String,
            default: "",
        },
        facebook: {
            type: String,
            default: "",
        },
        twitter: {
            type: String,
            default: "",
        },
        github: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        }
    },
    account_info: {
        total_posts: {
            type: Number,
            default: 0
        },
        total_reads: {
            type: Number,
            default: 0
        },
    },
    google_auth: {
        type: Boolean,
        default: false
    },
    blogs: {
        type: [Schema.Types.ObjectId],
        ref: 'blogs',
        default: [],
    }

},
    {
        timestamps: {
            createdAt: 'joinedAt'
        }

    })

export default mongoose.model("users", userSchema);
```

### Schema Fields

1. **personal_info**
   - **fullname**: User's full name, required and must be at least 3 characters long.
   - **email**: User's email, required and must be unique.
   - **password**: User's hashed password (used for non-Google authentication).
   - **username**: User’s unique username, auto-generated from the email if not provided.
   - **bio**: Short bio about the user, max 200 characters.
   - **profile_img**: User’s profile image, randomly generated from a list of preset image names and collections.

2. **social_links**
   - User’s social media links (YouTube, Instagram, Facebook, Twitter, GitHub, Website).

3. **account_info**
   - **total_posts**: Total number of blogs written by the user.
   - **total_reads**: Total number of reads on user’s blogs.

4. **google_auth**: Boolean value indicating if the user signed up using Google.

5. **blogs**: List of blog IDs associated with the user.

---

# Backend Routes & Server Logic (Part 1) - `server.js`

The backend server handles user authentication, blog management, and image upload using AWS S3. It also uses Google authentication through Firebase.

### Prerequisites

Ensure the following environment variables are set:

- `DB_LOCATION`: MongoDB connection URI.
- `AWS_BUCKET_NAME`: AWS S3 bucket name.
- `AWS_BUCKET_REGION`: AWS S3 region.
- `AWS_ACCESS_KEY`: AWS access key.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key.
- `SECRET_ACCESS_KEY`: JWT secret key for authentication.
- Firebase service account credentials file.

---

### Server Setup

The server is built with **Express** and **MongoDB**. It uses **bcrypt** for password hashing, **JWT** for authentication, and **AWS SDK** for image upload.

```javascript
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin";
import serviceAccountKey from "./the-thought-trail-firebase-adminsdk-8l86z-6703c37d2f.json" with { type: "json" }
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";

// schema imports
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";

const server = express();
let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

server.use(express.json());
server.use(cors())

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})
```

---

### AWS S3 Setup for Image Upload

The S3 bucket is configured to store images, with a function to generate pre-signed URLs for image uploads.

```javascript
const s3 = new aws.S3({
    region: process.env.AWS_BUCKET_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg"
    })
}

// Route to get the upload URL
server.get('/get-upload-url', (req, res) => {
    generateUploadURL().then(url => res.status(200).json({ uploadURL: url }))
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })
        })
})
```

---

### User Authentication Routes

#### Signup

Handles user registration with validation for name, email, and password.

```javascript
server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;

    // Validating the data from frontend
    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Fullname must be at least 3 letters long" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email);

        let user = new User({
            personal_info: { fullname, email, password: hashed_password, username }
        })

        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(u))
        })
        .catch(err => {
            if (err.code == 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }
            return res.status(500).json({ "error": err.message })
        })
    })
})
```

#### Signin

Handles user login via email and password.

```javascript
server.post("/signin", (req, res) => {
    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" });
            }

            if (!user.google_auth) {
                bcrypt.compare(password, user.personal_info.password, (err, result) => {
                    if (err) {
                        return res.status(403).json({ "error": "Error occurred while login please try again" });
                    }
                    if (!result) {
                        return res.status(403).json({ "error": "Incorrect password" })
                    } else {
                        return res.status(200).json(formatDatatoSend(user))
                    }
                })
            } else {
                return res.status(403).json({ "error": "Account was created using Google. Try logging in with Google." })
            }
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ "error": err.message })
        })
})
```

#### Google Authentication

Handles user login or signup using Google Authentication through Firebase.

```javascript


server.post("/google-auth", async (req, res) => {
    let { access_token } = req.body;

    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            let { email, name, picture } = decodedUser;
            picture = picture.replace("s96-c", "s384-c");

            let user = await User.findOne({ "personal_info.email": email }).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
                return u || null
            })
            .catch(err => {
                return res.status(500).json({ "error": err.message })
            })

            if (user) {
                if (!user.google_auth) {
                    return res.status(403).json({ "error": "This email was signed up without Google. Please log in with password." })
                }
            } else {
                let username = await generateUsername(email);
                user = new User({
                    personal_info: { fullname: name, email, username },
                    google_auth: true
                })

                await user.save().then((u) => { user = u; })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })
            }

            return res.status(200).json(formatDatatoSend(user))
        })
        .catch(err => {
            return res.status(500).json({ "error": "Failed to authenticate with Google." })
        })
})
```
