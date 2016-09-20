


define(
        [
            "jquery"
        ],
        function ($) {


            return function (params) {


                // checking that params is an object with a "url" property which is a string
                if (!params || typeof params !== "object" || !params.url || typeof params.url !== "string") {
                    console.log("audioFileUploader received improper arguments!");
                    return false;
                }


                // wiring up a STRAIGHT DOM ELEMENT to be droppable - not a file input tag!
                // NEW TEST making the WHOLE PAGE the drop target!
                $("html").on("dragover dragenter", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }).on("drop", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    upload(e.originalEvent.dataTransfer.files);
                });


                function upload(files) {


                    // getting the file names from the params - only the ones where the checkbox is checked!
                    var fileNames = [];


                    // selecting only the CHECKED checkboxes, 
                    // or ALL of them if NONE are checked
                    var $problemHolders;
                    if ($(".select-checkbox:checked").length === 0) {
                        $problemHolders = $(".individual-problem-holder");
                    } else {
                        $problemHolders = $(".individual-problem-holder").filter(function () {
                            return $(this).find(".select-checkbox:checked").length >= 1;
                        });
                    }


                    // grabbing the content of the first .problem-input, and putting it in the fileNames array
                    $problemHolders.each(function () {
                        var value = $(this).find(".problem-input").eq(0).val();
                        fileNames.push(value);
                    });


                    // creating a new FormData() instance
                    var formData = new FormData();


                    // exiting if there are no files
                    if (files.length === 0) {
                        alert("There are no files to upload!");
                        return;
                    }


                    if (fileNames.length !== files.length) {
                        alert("Number of files doesn't match number of checked items!");
                        return;
                    }


                    // cycling through the files object, preparing the FormData object
                    // NOTE that we have to use for loop on the "files" object; can't use forEach!
                    for (var i = 0; i < files.length; i++) {


                        // allowing only .mp3 files
                        if (!files[i].type.match(".mp3")) {
                            console.log("File is not .mp3!");
                            return;
                        }


                        // nothing larger than 5 megabytes
                        if (!files[i].size > 500000) {
                            console.log("File is too large!");
                            return;
                        }


                        // add the file to the request.
                        formData.append("files[]", files[i], fileNames[i] + ".mp3"); // have to add ".mp3" because the server checks for this file extension!
                    }


                    // not using jQuery!
                    var ajax = new XMLHttpRequest();


                    // wiring up to check for COMPLETION
                    ajax.onreadystatechange = function () {
                        if (ajax.status && ajax.status === 200 && ajax.readyState === 4) {
                            if (params.onUpload) {
                                params.onUpload();
                            }
                        }
                    };


                    // checking for PROGRESS
//                    ajax.upload.addEventListener("progress", function (event) {
//                        // do some stuff here!
//                        // var percent = (event.loaded / event.total) * 100;
//                    });


                    // adding the text_id & problem_group_id to the URL, so we can save that info along with the file name
                    var string = params.text_id() + "/" + params.problem_group_id();


                    // FINALLY opening the connection, and sending the form
                    ajax.open("POST", params.url + string, true);
                    ajax.send(formData);
                }

            };

        }
);