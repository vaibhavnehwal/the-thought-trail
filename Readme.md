# The Thought Trail - Documentation

## Project Overview

**The Thought Trail** is a full-stack blogging platform built using the MERN stack (MongoDB, Express, React, and Node.js). The application allows users to write, view, and interact with blogs. It supports user authentication via email and Google (Firebase integration) and features functionalities such as trending blogs, tagging, and search. Users have profile and dashboard pages where they can manage their blogs and personal information.

The platform includes a rich text editor for blogs with image upload functionality via an AWS S3 bucket and has a dark and light theme toggle.

---

## Project Setup
1. Make sure you have Node.js installed on your system. You can install Node by using this website (https://nodejs.org/en/download/package-manager).
2. After installing Node, run the following command after navigating to the frontend and backend folders to install all the dependencies:
`npm i`
3. After installing the dependencies, create a .env file in both the directories
4. The frontend .env should contain the following variables:
`
VITE_SERVER_DOMAIN=http://165.232.184.43 
VITE_FIREBASE_API_KEY="Examplefirebaseapikey"
`
5. The backend requires several environment variables to function correctly, stored in a `.env` file:
- `DB_LOCATION`: MongoDB connection URI.
- `SECRET_ACCESS_KEY`: JWT secret key for user authentication.
- `AWS_ACCESS_KEY`: AWS access key for S3 bucket integration.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for S3.
- `AWS_BUCKET_NAME`: The name of the AWS S3 bucket used for storing blog images.
- `AWS_BUCKET_REGION`: AWS S3 bucket region.
- `AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = 1`: Suppresses AWS SDK maintenance messages.
- **Firebase Admin** credentials for Google login:
  - A Firebase service account file (.json format) must be imported and named correctly in the `server.js` file at line 9.
6. Once all of this is done, you must navigate to frontend/src/common/firebase.jsx and add your Firebase configuration.

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
Here’s the continuation of the **server.js** documentation:

---

## User Password Management

### Change Password

Allows a logged-in user to change their password, provided they have not signed up using Google.

```javascript
server.post("/change-password", verifyJWT, (req, res) => {
    let { currentPassword, newPassword } = req.body;

    // Validate password format
    if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" });
    }

    // Find the user
    User.findOne({ _id: req.user })
        .then((user) => {
            // Check if the user signed up using Google
            if (user.google_auth) {
                return res.status(403).json({ error: "You can't change account's password because you logged in through Google" });
            }

            // Compare current password
            bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Some error occurred while changing the password, please try again later" });
                }

                if (!result) {
                    return res.status(403).json({ error: "Incorrect current password" });
                }

                // Hash new password and update
                bcrypt.hash(newPassword, 10, (err, hashed_password) => {
                    User.findOneAndUpdate({ _id: req.user }, { "personal_info.password": hashed_password })
                        .then(() => res.status(200).json({ status: 'Password changed' }))
                        .catch(err => res.status(500).json({ error: 'Some error occurred while saving new password, please try again later' }));
                });
            });
        })
        .catch(err => res.status(500).json({ error: "User not found" }));
});
```

## Blog Management

### Latest Blogs

Fetches a paginated list of the latest published blogs.

```javascript
server.post('/latest-blogs', (req, res) => {
    let { page } = req.body;
    let maxLimit = 5;

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => res.status(200).json({ blogs }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### All Latest Blogs Count

Returns the total count of all published blogs.

```javascript
server.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then(count => res.status(200).json({ totalDocs: count }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Trending Blogs

Fetches a list of the top 5 trending blogs based on total reads and likes.

```javascript
server.get("/trending-blogs", (req, res) => {
    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then(blogs => res.status(200).json({ blogs }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Search Blogs

Searches for blogs based on tags, query, or author, with pagination.

```javascript
server.post("/search-blogs", (req, res) => {
    let { tag, query, author, page, limit, eliminate_blog } = req.body;
    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    let maxLimit = limit ? limit : 2;

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => res.status(200).json({ blogs }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Search Blogs Count

Returns the count of blogs matching the search criteria.

```javascript
server.post("/search-blogs-count", (req, res) => {
    let { tag, author, query } = req.body;
    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    Blog.countDocuments(findQuery)
        .then(count => res.status(200).json({ totalDocs: count }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

## User Management

### Search Users

Searches for users by username.

```javascript
server.post("/search-users", (req, res) => {
    let { query } = req.body;

    User.find({ "personal_info.username": new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
        .then(users => res.status(200).json({ users }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Get Profile

Fetches user profile details by username.

```javascript
server.post("/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updatedAt -blogs")
        .then(user => res.status(200).json(user))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Update Profile Image

Allows a logged-in user to update their profile image URL.

```javascript
server.post("/update-profile-img", verifyJWT, (req, res) => {
    let { url } = req.body;

    User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
        .then(() => res.status(200).json({ profile_img: url }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```
Here’s the documentation for the remaining parts of the `server.js` file:

---

### Update Profile

Allows a logged-in user to update their profile information, including username, bio, and social links. 

```javascript
server.post("/update-profile", verifyJWT, (req, res) => {
    let { username, bio, social_links } = req.body;

    let bioLimit = 150;

    // Validate username length
    if (username.length < 3) {
        return res.status(403).json({ error: "Username should be at least 3 letters long" });
    }

    // Validate bio length
    if (bio.length > bioLimit) {
        return res.status(403).json({ error: `Bio should not be more than ${bioLimit} characters` });
    }

    // Validate social links
    let socialLinksArr = Object.keys(social_links);

    try {
        for (let i = 0; i < socialLinksArr.length; i++) {
            if (social_links[socialLinksArr[i]].length) {
                let hostname = new URL(social_links[socialLinksArr[i]]).hostname;
                if (!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] != 'website') {
                    return res.status(403).json({ error: `${socialLinksArr[i]} link is invalid. You must enter a full link` });
                }
            }
        }
    } catch (err) {
        return res.status(500).json({ error: "You must provide full social links with http(s) included" });
    }

    let updateObj = {
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links
    }

    User.findOneAndUpdate({ _id: req.user }, updateObj, { runValidators: true })
        .then(() => res.status(200).json({ username }))
        .catch(err => {
            if (err.code === 11000) {
                return res.status(409).json({ error: "Username is already taken" });
            }
            return res.status(500).json({ error: err.message });
        });
});
```

## Blog Management

### Create or Update Blog

Creates a new blog or updates an existing blog. Validation checks ensure that required fields are provided and valid.

```javascript
server.post('/create-blog', verifyJWT, (req, res) => {
    let authorId = req.user;
    let { title, des, banner, tags, content, draft, id } = req.body;

    // Validate required fields
    if (!title.length) {
        return res.status(403).json({ error: "You must provide a title" });
    }

    if (!draft) {
        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: "You must provide a blog description under 200 characters" });
        }

        if (!banner.length) {
            return res.status(403).json({ error: "You must provide a blog banner to publish it" });
        }

        if (!content.blocks.length) {
            return res.status(403).json({ error: "There must be some blog content to publish it" });
        }

        if (!tags.length || tags.length > 10) {
            return res.status(403).json({ error: "Provide tags in order to publish the blog. Maximum 10 tags" });
        }
    }

    tags = tags.map(tag => tag.toLowerCase());
    let blog_id = id || title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();

    if (id) {
        // Update existing blog
        Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
            .then(() => res.status(200).json({ id: blog_id }))
            .catch(err => res.status(500).json({ error: "Failed to update blog" }));
    } else {
        // Create new blog
        let blog = new Blog({
            title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
        });

        blog.save()
            .then(blog => {
                let incrementVal = draft ? 0 : 1;
                User.findOneAndUpdate({ _id: authorId }, { $inc: { "account_info.total_posts": incrementVal }, $push: { "blogs": blog._id } })
                    .then(() => res.status(200).json({ id: blog.blog_id }))
                    .catch(err => res.status(500).json({ error: "Failed to update total posts number" }));
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }
});
```

### Get Blog

Fetches a blog by its ID, updates the read count, and handles draft blogs.

```javascript
server.post("/get-blog", (req, res) => {
    let { blog_id, draft, mode } = req.body;
    let incrementVal = mode !== 'edit' ? 1 : 0;

    Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .select("title des content banner activity publishedAt blog_id tags")
        .then(blog => {
            User.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {
                $inc: { "account_info.total_reads": incrementVal }
            })
            .catch(err => res.status(500).json({ error: err.message }));

            if (blog.draft && !draft) {
                return res.status(500).json({ error: 'You cannot access draft blogs' });
            }

            return res.status(200).json({ blog });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Like Blog

Allows a logged-in user to like or unlike a blog. Creates or deletes a notification for the like action.

```javascript
server.post("/like-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, islikedByUser } = req.body;
    let incrementVal = !islikedByUser ? 1 : -1;

    Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
        .then(blog => {
            if (!islikedByUser) {
                let like = new Notification({
                    type: "like",
                    blog: _id,
                    notification_for: blog.author,
                    user: user_id
                });

                like.save().then(() => res.status(200).json({ liked_by_user: true }));
            } else {
                Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
                    .then(() => res.status(200).json({ liked_by_user: false }))
                    .catch(err => res.status(500).json({ error: err.message }));
            }
        });
});
```

---

## Comment Management

### Check if Blog is Liked by User

Checks whether the logged-in user has liked a specific blog.

```javascript
server.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", blog: _id })
        .then(result => res.status(200).json({ result }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Add Comment

Adds a new comment to a blog. Supports adding replies to comments and creates notifications for the comment.

```javascript
server.post("/add-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, comment, blog_author, replying_to, notification_id } = req.body;

    if (!comment.length) {
        return res.status(403).json({ error: 'Write something to leave a comment' });
    }

    let commentObj = {
        blog_id: _id,
        blog_author,
        comment,
        commented_by: user_id,
    };

    if (replying_to) {
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    new Comment(commentObj).save().then(async commentFile => {
        let { comment, commentedAt, children } = commentFile;

        Blog.findOneAndUpdate(
            { _id },
            { $push: { "comments": commentFile._id }, $inc: { "activity.total_comments": 1, "activity.total_parent_comments": replying_to ? 0 : 1 } }
        ).then(blog => console.log('New comment created'));

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        };

        if (replying_to) {
            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate(
                { _id: replying_to },
                { $push: { children: commentFile._id } }
            ).then(replyingToCommentDoc => {
                notificationObj.notification_for = replyingToCommentDoc.commented_by;
            });

            if (notification_id) {
                Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile._id })
                    .then(() => console.log('Notification updated'));
            }
        }

        new Notification(notificationObj).save().then(() => console.log('New notification created'));

        return res.status(200).json({
            comment, commentedAt, _id: commentFile._id, user_id, children
        });
    });
});
```

### Get Blog Comments

Fetches comments for a blog with pagination.

```javascript
server.post("/get-blog-comments", (req, res) => {
    let { blog_id, skip } = req.body;
    let maxLimit = 5;

    Comment.find({ blog_id, isReply: false })
        .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
        .skip(skip)
        .limit(maxLimit)
        .sort({ 'commentedAt': -1 })
        .then(comment => res.status(200).json(comment))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Get Comment Replies

Fetches replies to a specific comment with pagination.

```javascript
server.post("/get-replies", (req, res) => {
    let { _id, skip } = req.body;
    let maxLimit = 5;

    Comment.findOne({ _id })
        .populate({
            path: "children",
            options: {
                limit: maxLimit,
                skip: skip,
                sort: { 'commentedAt': -1 }
            },
            populate: {
                path: 'commented_by',
                select: "personal_info.profile_img personal_info.fullname personal_info.username"
            },
            select: "-blog_id -updatedAt"
        })
        .select("children")
        .then(doc => res.status(200).json({ replies: doc.children }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Delete Comment

Deletes a comment and its associated data, including child comments and notifications.

```javascript
const deleteComments = (_id) => {
    Comment.findOneAndDelete({ _id })
        .then(comment => {
            if (comment.parent) {
                Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: { children: _id } })
                    .then(() => console.log('Comment deleted from parent'))
                    .catch(err => console.log(err));
            }

            Notification.findOneAndDelete({ comment: _id }).then(() => console.log('Comment notification deleted'));
            Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } }).then(() => console.log('Reply notification deleted'));

            Blog.findOneAndUpdate(
                { _id: comment.blog_id },
                { $pull: { comments: _id }, $inc: { "activity.total_comments": -1, "activity.total_parent_comments": comment.parent ? 0 : -1 } }
            ).then(blog => {
                if (comment.children.length) {
                    comment.children.forEach(replies => deleteComments(replies));
                }
            });
        })
        .catch(err => console.log(err.message));
}

server.post("/delete-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Comment.findOne({ _id })
        .then(comment => {
            if (user_id === comment.commented_by || user_id === comment.blog_author) {
                deleteComments(_id);
                return res.status(200).json({ status: 'done' });
            } else {
                return res.status(403).json({ error: "You cannot delete this comment" });
            }
        });
});
```

## Notification Management

### Check for New Notifications

Checks if there are any new notifications for the logged-in user.

```javascript
server.get("/new-notification", verifyJWT, (req, res) => {
    let user_id = req.user;

    Notification.exists({ notification_for: user_id, seen: false, user: { $ne: user_id } })
        .then(result => {
            if (result) {
                return res.status(200).json({ new_notification_available: true });
            } else {
                return res.status(200).json({ new_notification_available: false });
            }
        })
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Fetch Notifications

Fetches notifications for the logged-in user with pagination and filtering.

```javascript
server.post("/notifications", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { page, filter, deletedDocCount } = req.body;
    let maxLimit = 10;
    let findQuery = { notification_for: user_id, user: { $ne: user_id } };
    let skipDocs = (page - 1) * maxLimit;

    if (filter !== 'all') {
        findQuery.type = filter;
    }

    if (deletedDocCount) {
        skipDocs -= deletedDocCount;
    }

    Notification.find(findQuery)
        .skip(skipDocs)
        .limit(maxLimit)
        .populate("blog", "title blog_id")
        .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
        .populate("comment", "comment")
        .populate("replied_on_comment", "comment")
        .populate("reply", "comment")
        .sort({ createdAt: -1 })
        .select("createdAt type seen reply")
        .then(notifications => {
            Notification.updateMany(findQuery, { seen: true })
                .skip(skipDocs)
                .limit(maxLimit)
                .then(() => console.log('Notifications marked as seen'));

            return res.status(200).json({ notifications });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Get Total Notifications Count

Gets the total count of notifications for the logged-in user, optionally filtered by type.

```javascript
server.post("/all-notifications-count", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { filter } = req.body;
    let findQuery = { notification_for: user_id, user: { $ne: user_id } };

    if (filter !== 'all') {
        findQuery.type = filter;
    }

    Notification.countDocuments(findQuery)
        .then(count => res.status(200).json({ totalDocs: count }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

## Blog Management

### Get User-Written Blogs

Fetches blogs written by the logged-in user, with support for pagination and searching by title.

```javascript
server.post("/user-written-blogs", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { page, draft, query, deletedDocCount } = req.body;
    let maxLimit = 5;
    let skipDocs = (page - 1) * maxLimit;

    if (deletedDocCount) {
        skipDocs -= deletedDocCount;
    }

    Blog.find({ author: user_id, draft, title: new RegExp(query, 'i') })
        .skip

(skipDocs)
        .limit(maxLimit)
        .sort({ publishedAt: -1 })
        .select("title banner publishedAt blog_id activity des draft -_id")
        .then(blogs => res.status(200).json({ blogs }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Get Count of User-Written Blogs

Gets the total count of blogs written by the logged-in user, optionally filtered by draft status and title.

```javascript
server.post("/user-written-blogs-count", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { draft, query } = req.body;

    Blog.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
        .then(count => res.status(200).json({ totalDocs: count }))
        .catch(err => res.status(500).json({ error: err.message }));
});
```

### Delete Blog

Deletes a blog and its associated data, including comments and notifications.

```javascript
server.post("/delete-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { blog_id } = req.body;

    Blog.findOneAndDelete({ blog_id })
        .then(blog => {
            Notification.deleteMany({ blog: blog._id }).then(() => console.log('Notifications deleted'));
            Comment.deleteMany({ blog_id: blog._id }).then(() => console.log('Comments deleted'));
            User.findOneAndUpdate(
                { _id: user_id },
                { $pull: { blog: blog._id }, $inc: { "account_info.total_posts": -1 } }
            ).then(() => console.log('Blog deleted'));

            return res.status(200).json({ status: 'done' });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});
```

---
