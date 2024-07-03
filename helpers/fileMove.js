const fsExtra = require("fs-extra");

exports.moveFiles = (folderPath, imageName) => {
    
    fsExtra.move(
    `public/temp/${imageName}`,
    `${folderPath}/${imageName}`,
    {overwrite: true },
    (err) => {
      if (err) return console.log("err=========", err);
      console.log(`File successfully moved!!`);
    },
  );
};