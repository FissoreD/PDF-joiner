// var dropZone = document.getElementById('dropZone')!;

// // Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
// dropZone.addEventListener('dragover', function (e) {
//   e.stopPropagation();
//   e.preventDefault();
//   if (e.dataTransfer === null) return
//   e.dataTransfer.dropEffect = 'copy';
// });

// // Get file data on drop
// dropZone.addEventListener('drop', function (e) {
//   if (e.dataTransfer === null) return
//   e.stopPropagation();
//   e.preventDefault();
//   var files = e.dataTransfer.files; // Array of all files

//   for (const file of files) {
//     console.log(file.type);

//     if (file.type.match(/.*pdf.*/)) {
//       var reader = new FileReader();
//       reader.onload = function (e2) {
//         // finished reading file data.
//         var img = document.createElement('img');
//         if (e2.target === null) return
//         img.src = e2.target.result as string;
//         document.body.appendChild(img);
//       }
//       reader.readAsDataURL(file); // start reading the file data.
//     }
//   }
// });