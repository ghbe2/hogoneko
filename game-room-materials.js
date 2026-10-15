'use strict';
const beforeRoomMaterials=bookBackground;
bookBackground=function(node,svg){
 // Replace the old all-over room grain, not layer more noise over the window.
 if(node?.matches('.book-room')&&svg)return textureBackground(node,RoomMaterials.decorate(svg,'linen'));
 return beforeRoomMaterials(node,svg);
};
