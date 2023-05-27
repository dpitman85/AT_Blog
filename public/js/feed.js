import data from '../data/posts.json' assert { type: 'json'};

const feed = document.getElementById("main");

console.log(data);


window.onload = function() {
    data.forEach(item => addPost(item));
};

function addPost(postData) {
    //set variables for new HTML elements
    var newPost = document.createElement("div");
    var newPostDate = document.createElement("div");
    var newPostImage = document.createElement("div");
    var newPostText = document.createElement("div");
    var newPostIndex = document.createElement("div");
    var date = new Date();
    
    //set class names for new HTML elements
    newPost.className = "post";
    newPostDate.className = "post-date";
    newPostImage.className = "post-image";
    newPostText.className = "post-text";
    newPostIndex.className = "post-index";
    
    //insert post content into relevant elements
    newPostDate.innerHTML = `${postData.postDate}`;
    newPostImage.setAttribute("style", `background-image: url(images/${postData.postImage})`);
    newPostImage.innerHTML = `<img src="images/${postData.postImage}">`;
    newPostText.innerHTML = `${postData.postText}`;
    newPostIndex.innerHTML = `${postData.id}`;

    /* Dummy Data for Testing
    newPostDate.innerHTML = `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`;
    newPostImage.setAttribute("style", "background-image: url(images/demo.jpg)");
    newPostImage.innerHTML = `<img src="images/demo.jpg">`;
    newPostText.innerHTML = `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras nulla ante, lacinia eu sem in, lobortis congue eros. Nam tincidunt purus sit amet ipsum euismod condimentum. Pellentesque sed felis id neque tincidunt vehicula quis quis urna. Mauris tristique tortor quis blandit tempus. Nulla et libero in eros viverra commodo vel sit amet lorem. In sit amet laoreet purus. Quisque pellentesque purus sed arcu lacinia, sed faucibus lacus tincidunt. Mauris egestas aliquam elementum.</p><p>Vestibulum nibh ipsum, aliquam id interdum a, tincidunt a tellus. Aenean commodo et libero sed blandit. Vestibulum tellus enim, sodales et neque eget, tincidunt euismod magna. Duis facilisis vestibulum orci in tincidunt. Etiam ultrices aliquam dolor non auctor. Quisque id sodales leo, in blandit nisi. Cras ut congue urna.</p><p>Etiam id ante dignissim, imperdiet dui ac, porta sem. Sed euismod dignissim mauris, id dapibus lectus dignissim quis. Nunc felis augue, consequat a erat id, tincidunt imperdiet velit. Donec sed posuere lorem. Maecenas euismod est metus, ac lacinia risus tincidunt volutpat. Duis faucibus rhoncus velit non semper. Fusce a neque volutpat, vestibulum nisl facilisis, vulputate dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Integer feugiat aliquam sem ac rutrum. Maecenas malesuada eros et nulla condimentum finibus. Morbi vel magna neque. Nulla bibendum, metus et molestie faucibus, libero metus tempus dolor, non blandit nisl nulla consequat felis. Aliquam congue mi quis ante porttitor, luctus vulputate elit aliquam.</p>`;
    newPostIndex.innerHTML = "1";
    */

    //append elements into page
    newPost.append(newPostDate, newPostImage, newPostText, newPostIndex);
    feed.append(newPost);
}


