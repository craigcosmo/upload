(function($){
	$.fn.upload = function(options){
		
		let	html = `<li>
						<div class="progressor"></div>
						<div class="progress-bar-container">
							<div class="progress-bar">
							</div>
						</div>
						<a class="cancel-upload" title="cancel"></a>
					</li>`



		let defaults = {
			list : '',
			item: html,
			url : '',
			dropZone:'',
			progressor: '',
			progressBar:'.progress-bar',
			onSubmit:function(){},
			onProgress:function(){},
			onComplete:function(){},
			onCancel:function(){},
			onSizeError:function(){},
			onTypeError:function(){},
			onLengthError:function(){},
			onDimensionError:function(){},
			allowedType:0,
			maxLength:0,
			minWidth:0,
			minHeight:0,
			minSize:0,
			maxSize:0
		}


		let o = Object.assign(defaults, options)


		return this.each(function(){
			
			let input = this
			

			function uploadFile(file){

				let list = document.querySelector(o.list)

				let i = create_dom_from_string(o.item)

				list.appendChild(i)

				// var item = $(i);

				let bar = i.querySelector(o.progressBar)

				// i.querySelector(o.progressor).innerHTML = '0%';
				let progressor = i.querySelector(o.progressor)
				progressor.innerHTML = '0%'
				// var	bar = item.find(o.progressBar);
				// var	progressor = item.find(o.progressor).text('0%');
				let	size = parseInt(file.size/1024,10)
				let name = file.name
				// var	object = $(i);
				let	object = i



				let	total
				let	loaded = 0
				let	progress = '0%'
				let	progessFlow = '0%'
				// this path show the temporary file on browser
				// which can be access via image src
				let	path = URL.createObjectURL(file)
				// var	index = $(i).index();
				let	index = Array.prototype.slice.call(list.children).indexOf(i)
				console.log(index)
				// var index = document.querySelectorAll('');
				let	response
				let xhr = new XMLHttpRequest()

				object.name = name
				object.size = size
				object.path = path
				object.index = index
				object.progress = progress
				object.progessFlow = progessFlow
				object.loaded = loaded

				o.onSubmit.call(this, object)
						
				

				// xhr.upload.addEventListener("progress", function (e) { }, false);
				xhr.upload.onprogress =function(e){
					object.progessFlow = progessFlow = (e.loaded / e.total) * 100 + '%'
					object.progress = progress = Math.round((e.loaded / e.total) * 100) + '%'
					object.loaded = loaded = parseInt(e.loaded/1024,10)
					// total = e.total *1024;

					// if(bar.length) bar.style.width = progessFlow;
					if(document.contains(bar)) bar.style.width = progessFlow
					if(document.contains(progressor)) progressor.innerHTML = progress

					o.onProgress.call(this, object)
				}
				// xhr.addEventListener("load", function () {}, false);
				xhr.onload = function(){
					//update progress bar to 100% in firefox
					//update progress number to display in the view
					// if(bar.length) progress = bar.style.width = 100 + "%";
					if(document.contains(bar)) progress = bar.style.width = 100 + '%'
					if(document.contains(progressor)) progressor.innerHTML = progress
					// loaded should be equal total by now
					// loaded = total;

					// check if response is json object or text
					response = sortResponse(xhr.responseText)
					o.onComplete.call(this, object, response)
				}

				// xhr.responseType
				// xhr.response contain the value fetched from server
				 // var blob = new Blob([this.response], {type: 'image/png'});

				 // var blob = this.response;

			  //   var img = document.createElement('img');
			  //   img.onload = function(e) {
			  //     window.URL.revokeObjectURL(img.src); // Clean up after yourself.
			  //   };
			  //   img.src = window.URL.createObjectURL(blob);
			  //   document.body.appendChild(img);

				xhr.open('post', o.url, true)
				
				// Set appropriate headers
				// xhr.setRequestHeader("Cache-Control", "no-cache");
				// xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.setRequestHeader('Content-Type', 'multipart/form-data') 

				// xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
				// xhr.setRequestHeader('Content-Type', mimeType);
				// xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + file.name + '"');
				// xhr.setRequestHeader("X-File-Name", file.name);
				// Access-Control-Allow-Headers
				xhr.setRequestHeader('X-File-Name', unescape(encodeURIComponent(file.name)))
				// fixed vietnamese character file name bug
				xhr.setRequestHeader('X-File-Size', file.size)
				xhr.setRequestHeader('X-File-Type', file.type)
	
				// var fd = new FormData();
				// fd.append("upload_file", file);
				// xhr.send(fd);

				// Send the file
				xhr.send(file)

				return xhr
			}

			

			function traverseFiles (files) {
				for (let i=0, l=files.length; i<l; i++) {

					let type= getTrueFileType(files[i])
					// console.log(type);
					var item_vol = document.querySelector(o.list).children.length

					if(o.allowedType.length && !o.allowedType.match(type)){
						o.onTypeError.call(this, {name: files[i].name} )
					}
					else if(o.maxSize >0 && parseInt(files[i].size/1024) > o.maxSize){
						o.onSizeError.call(this, {name: files[i].name})
					}
					else if(o.maxLength>0 && item_vol >= o.maxLength){
						o.onLengthError.call(this, item_vol)
					}
					else if (typeof FileReader !== 'undefined'){

						getImgSize(files[i], function(file, width, height){
							// console.log(file.type);
							if(o.minWidth>0 && width<o.minWidth){
								o.onDimensionError.call(this, {name :file.name, width: width, height: height})
							}
							else if(o.minHeight>0 && height<o.minHeight){
								o.onDimensionError.call(this, {name :file.name, width: width, height: height})
							}
							else if(item_vol >= o.maxLength){//needed double check items length
								o.onLengthError.call(this, item_vol)	
							}
							else {
								uploadFile(file)
								// console.log(i);
								// console.log(files[i]);
								// uploadFile(files[i]);

							}
						})
					}
				}
			}
			
			function create_dom_from_string(string){
				let div = document.createElement('div')
				div.innerHTML = string
				return div.firstChild
			}

			function getImgSize(file, callback){
				let reader = new FileReader()  
				reader.onload = function(evt) {
					let image = new Image()
					image.onload = function(evt) {
						let width = this.width
						let height = this.height
						callback && callback(file, width, height)
					}
					image.src = evt.target.result 
				}
				reader.readAsDataURL(file)
			}

			function getTrueFileType(file){
				// console.log(file.type);
				if(file.type.length>0) {
					return file.type.split('/')[1].toLowerCase().trim()
				}else{ return ''}
				// some file might have empty string, emptry doesn't work with split, throw error
			}

			// check if response is json object

			function sortResponse(response){
				let isJSON = true

				try {JSON.parse(response)} catch (e) {isJSON = false}

				let sorted = isJSON ? JSON.parse(response) : response

				return sorted
			}


			// cancel
			// call cancel by trigger cancel event on input
			input.addEventListener('cancel', function(){
				uploadFile.abort()
				o.onCancel.call(this)
			}, false)

			input.addEventListener('change', function () {
				traverseFiles(this.files)
			}, false)
			
			
			// drag and drop file
			// detect dropzone, if there is no dropzone, create a random element for the event to bind with
			// that means the events are useless without a delegated dropzone
			let DZ = o.dropZone.length ? document.querySelector(o.dropZone) : document.createElement('section')

			DZ.addEventListener('dragleave', function (evt) {
				let target = evt.target
				evt.preventDefault()
				evt.stopPropagation()
			}, false)
			
			DZ.addEventListener('dragenter', function (evt) {
				this.className = 'over'
				evt.preventDefault()
				evt.stopPropagation()
			}, false)
			
			DZ.addEventListener('dragover', function (evt) {
				evt.preventDefault()
				evt.stopPropagation()
			}, false)
			
			DZ.addEventListener('drop', function (evt) {
				traverseFiles(evt.dataTransfer.files)
				this.className = ''
				evt.preventDefault()
				evt.stopPropagation()
			}, false)
		})
	}
})(jQuery)