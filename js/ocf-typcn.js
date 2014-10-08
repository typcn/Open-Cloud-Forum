//load AVOS Cloud Script
$.getScript( "https://cn.avoscloud.com/scripts/lib/av-0.4.3.min.js" )
  .done(function( script, textStatus ) {
	AV.initialize(APPID, APPKEY); // Put your key here
	console.log("AVOS Cloud init Success");
	$( "#loading p" ).text( "连接成功，正在尝试读取信息，请稍后。" );
	Ocf.init();
  })
  .fail(function( jqxhr, settings, exception ) {
    $( "#loading header h2" ).text( "加载失败" );
	$( "#loading p" ).text( "云端连接失败，请检查网络连接，并尝试刷新网页。" );
});
var sitename = document.title;
//date output class
Date.prototype.format = function(format) {
       var date = {
              "M+": this.getMonth() + 1,
              "d+": this.getDate(),
              "h+": this.getHours(),
              "m+": this.getMinutes(),
              "s+": this.getSeconds(),
              "q+": Math.floor((this.getMonth() + 3) / 3),
              "S+": this.getMilliseconds()
       };
       if (/(y+)/i.test(format)) {
              format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
       }
       for (var k in date) {
              if (new RegExp("(" + k + ")").test(format)) {
                     format = format.replace(RegExp.$1, RegExp.$1.length == 1
                            ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
              }
       }
       return format;
}
   

//ocf init
var Ocf = {
	username:null,
	email:null,
	init:function(){
		setTimeout(this.loadUser(), 1);
		setTimeout(this.loadStat(), 2);
		setTimeout(onNavigate(), 3);
		setTimeout(this.Binds(), 4);
	},
　　loadUser: function(){
　　	console.log("User area load start");
		var currentUser = AV.User.current();
		if (currentUser) {
			this.username = currentUser.get("username");
			this.email = currentUser.get("email");
			$("#uname").text(this.username);
			console.log("User info got");
		} else {
			console.log("User not logged in");
			$("#login").show();
			$("#user").hide();
		}	
　　},
	Binds:function(){
		$("#signin").click( function() { 
				AV.User.logIn($("#un").val(), $("#pw").val(), {
				  success: function(user) {
					$("#user").show();
					$("#login").hide();
					var currentUser = AV.User.current();
					Ocf.username = currentUser.get("username");
					Ocf.email = currentUser.get("email");
					$("#uname").text(Ocf.username);
					console.log("Login success");
				  },
				  error: function(user, error) {
					$("#signin").text("登陆失败");
					console.log(error.message);
				  }
				});
			});
		$("#reg").click( function() { 
				if($(this).data("formext") == "0"){
					$("#pw").parent().append('<input id="email" type="email" placeholder="邮箱">');
					$(this).data("formext","1");
					return;
				}
				var user = new AV.User();
				user.set("username", $("#un").val());
				user.set("password", $("#pw").val());
				user.set("email", $("#email").val());
				user.signUp(null, {
				  success: function(user) {
					// Hooray! Let them use the app now.
				  },
				  error: function(user, error) {
					// Show the error message somewhere and let the user try again.
					alert("Error: " + error.code + " " + error.message);
				  }
				});

			});
		$("#person").click( function() { Ocf.PageLoader.uprofile(Ocf.username) });
		$("#logout").click( function() { 
			AV.User.logOut();
			$("#user").hide();
			$("#login").show();
			console.log("Logout Success");
		});		
	},
	loadMain: function(){
　　　　console.log("Main content load start");
		Ocf.PageLoader.fetchList(0);
		document.title = sitename;
		console.log("All Done");
　　},
	loadStat: function(){
　　　　query = new AV.Query(AV.User);
		query.count({
		  success: function(count) {
			$("#unum").text(count);
		  }
		});
		query = new AV.Query(AV.Object.extend("topic"));
		query.count({
		  success: function(count) {
			$("#tnum").text(count);
		  }
		});
		query = new AV.Query(AV.Object.extend("reply"));
		query.count({
		  success: function(count) {
			$("#rnum").text(count);
		  }
		});
		console.log("Stat Load Success");
　　},
};

Ocf.PageLoader = {
	push:function(url,title){
		if(!window.history.pushState){
			document.title = title;
			window.location = url;
		}else{
			window.history.pushState({title: title},title,url);
			document.title = title;
		}
	},
	
	uprofile:function(uname){
		this.push("#/profile/" + uname, uname + " 的个人首页");
	},
	setting:function(){
		this.push("#/setting", "设置");
	},
	loadPost:function(aid){
		var converter = new Markdown.Converter(),
		/* Alias the conversion method to make it easier to swap libraries in the future. */
		markdownToHtml = converter.makeHtml;
		$(".loading-icon").show();
		var topic = AV.Object.extend("topic");
		var post = new AV.Query(topic);
		post.get(aid).then(function(result) {
				$.ajax({ 
				  type : "GET", 
				  url : "ajaxContents/single.html?v=20141008", 
				  async : false, 
				  success : function(data){ 
						data = data.replace(/\{UserId\}/gi, result.get('user').id);
						var dinfo = result.get('dinfo');
						if(!dinfo) { dinfo = "unknow"; };
						data = data.replace(/\{dinfo\}/gi, dinfo);
						data = data.replace(/\{ObjId\}/gi, result.id);
						data = data.replace(/\{title\}/gi, result.get('title'));
						var cont_enc = html_encode(result.get('body'));
						data = data.replace(/\{Content\}/gi, markdownToHtml(cont_enc));
						data = data.replace(/\{date\}/gi, result.createdAt.format('yyyy-MM-dd hh:mm:ss'));
						$( "#main-content" ).empty();
						$("#main-content").append(data);
				  }
				}); 
				
				var comment = new AV.Query(AV.Object.extend("reply"));
				comment.equalTo("parent", result);
				comment.ascending("updatedAt");
				comment.exists("user");
				comment.exists("content");
				comment.notEqualTo("user", null);
				comment.notEqualTo("content", "");
				comment.find({
					success: function(comments) {
					
					//place comments
						$.ajax({ 
						  type : "GET", 
						  url : "ajaxContents/comment.html?v=20141008", 
						  async : false, 
						  success : function(data){ 
							for (var i = 0; i < comments.length; i++) {
								var object = comments[i];
								
								var postSub = data;
								postSub = postSub.replace(/\{UserId\}/gi, object.get('user').id);
								var dinfo = result.get('dinfo');
								if(!dinfo) { dinfo = "unknow"; };
								postSub = postSub.replace(/\{dinfo\}/gi, dinfo);
								postSub = postSub.replace(/\{ObjId\}/gi, object.id);
								postSub = postSub.replace(/\{date\}/gi, object.createdAt.format('yyyy-MM-dd hh:mm:ss'));
								var cont_enc = html_encode(object.get('content'));
								postSub = postSub.replace(/\{Content\}/gi, markdownToHtml(cont_enc));
								$("#main-content").append(postSub);
							  }
							//place reply form
							$.get( "ajaxContents/reply.html", function(data) {
								$("#main-content").append(data);
								//bind
								$("#sendreply").click(function(){
									Ocf.Post.reply($("#singlepost").data("aid"),$("#rcontent").val());
								});
							});
							Ocf.Post.loadListvar();
						  }
						}); 
					},
				  error: function(error) {
					console.log("comments load failed");
				  }
				});
				
				document.title = result.get('title') + '  |  ' +sitename;
			});
	},
	fetchList:function(skip){
		$(".loading-icon").show();
		var query = new AV.Query(AV.Object.extend("topic"));
		query.limit(10);
		query.skip(skip);
		query.descending("updatedAt");
		query.exists("user");
		query.exists("title");
		query.notEqualTo("user", null);
		query.notEqualTo("title", "");
		query.find({
		  success: function(results) {
			$( "#main-content" ).empty();
	
			$.ajax({ 
			  type : "GET", 
			  url : "ajaxContents/list.html?v=20141007", 
			  async : false, 
			  success : function(data){ 
				for (var i = 0; i < results.length; i++) {
					var object = results[i];
					var postSub = data;
					postSub = postSub.replace(/\{UserId\}/gi, object.get('user').id);
					postSub = postSub.replace(/\{ObjId\}/gi, object.id);
					postSub = postSub.replace(/\{title\}/gi, object.get('title'));
					postSub = postSub.replace(/\{date\}/gi, object.createdAt.format('yyyy-MM-dd'));
					$("#main-content").append(postSub);
				  }
			  }
			}); 

			Ocf.Post.loadListvar();
			
			//place post forms
			$.get( "ajaxContents/post.html?ver=20141006", function(data) {
				$("#main-content").append(data);
				//bind
				$("#postnew").click(function(){
					Ocf.Post.create($("#ptitle").val(),$("#pcontent").val());
				});
				
				$("#prev").click(function(){
						var re = /(http|https):\/\/[a-z.]*\/\#!\/([a-z]*)\/(.*)/g; 
						var m = re.exec(window.location.href);
						if(!m){  
							Ocf.PageLoader.push("#!/page/1","第1页");
							onNavigate();
							return;
						};
						if(m[2] == "page"){
							pagenum = parseInt(m[3]) - 1;
							Ocf.PageLoader.push("#!/page/" + pagenum,"第" + pagenum + "页");
							onNavigate();
						}
				});
				$("#next").click(function(){
						var re = /(http|https):\/\/[a-z.]*\/\#!\/([a-z]*)\/(.*)/g; 
						var m = re.exec(window.location.href);
						if(!m){  
							Ocf.PageLoader.push("#!/page/2","第2页");
							onNavigate();
							return;
						};
						if(m[2] == "page"){
							pagenum = parseInt(m[3]) + 1;
							Ocf.PageLoader.push("#!/page/" + pagenum,"第" + pagenum + "页");
							onNavigate();
						}
				});
			});
			
		  },
		  error: function(error) {
			$( "#loading header h2" ).text( "加载失败" );
			$( "#loading p" ).text( "错误代码:"  + error.code + " 错误信息: " +  error.message);
		  }
		});
	},
};

Ocf.Post = {
	create:function(title,content){
		
		var topic = AV.Object.extend("topic");
		var post = new topic();
		post.set("title",title);
		post.set("body",content);
		post.set("dinfo",$.ua.os.name + $.ua.os.version + " on " + $.ua.browser.name + $.ua.browser.major);
		post.set("user",AV.User.current());
		pACL = new AV.ACL(AV.User.current());
		pACL.setPublicReadAccess(true);
		post.setACL(pACL);
		post.save(null, {
		  success: function(post) {
			$('html,body').animate({scrollTop:0},'slow');
			console.log("Post Created");
			onNavigate();
		  },
		  error: function(obj, error) {
			alert('发送失败: ' + error.message);
		  }
		});
	},
	
	reply:function(parentID,content){
		if(!AV.User.current()){
			alert("未登录");
			return;
		}
		var post = AV.Object.createWithoutData("topic", parentID);
		var reply = AV.Object.extend("reply");
		var myreply = new reply();
		myreply.set("content", content);
		myreply.set("parent", post);
		myreply.set("dinfo",$.ua.os.name + $.ua.os.version + " on " + $.ua.browser.name + $.ua.browser.major);
		myreply.set("user", AV.User.current());
		pACL = new AV.ACL(AV.User.current());
		pACL.setPublicReadAccess(true);
		myreply.setACL(pACL);
		myreply.save(null, {
		  success: function(post) {
			console.log("Reply Created");
			$('html,body').animate({scrollTop:0},'slow');
			onNavigate()
		  },
		  error: function(obj, error) {
			alert('发送失败: ' + error.message);
		  }
		});
	},
	loadListvar:function(){
		$("article").each( function(){
			var uid = $(this).data('uid');
			var uquery =  new AV.Query(AV.User);
			var ele = $(this).children("p").children("#username");
			var topic = AV.Object.extend("topic");
			var rtopic = new topic();
			rtopic.id = $(this).data('aid');
			var rnumele = $(this).children("p").children("#replynum");
			uquery.get(uid).then(function(result) {
				ele.text(result.get('username'));
				replynum = new AV.Query(AV.Object.extend("reply"));
				replynum.equalTo("parent", rtopic);
				replynum.count({
				  success: function(count) {
					rnumele.text(count);
				  }
				});
			});
		});
		$(".loading-icon").hide();
	},
}

//url route
window.onpopstate = onNavigate;

function onNavigate(){
	console.log("PopState: " + window.location.href);
	var re = /(http|https):\/\/[a-z.]*\/\#!\/([a-z]*)\/(.*)/g; 
	var m = re.exec(window.location.href);
	if(!m){  
		Ocf.loadMain();
		return;
	};
	if(m[2] == "topic"){
		Ocf.PageLoader.loadPost(m[3]);
	}
	if(m[2] == "page"){
		$('html,body').animate({scrollTop:0},'slow');
		pagenum = m[3] - 1;
		Ocf.PageLoader.fetchList(pagenum*10);
	}
}

function html_encode(str)   
{   
	var s = "";
	if(str.length == 0) return "";
	s = str.replace(/<script[^>]*>(.|\n)*?<\/script>/ig,"不安全的内容已被过滤");
	s = s.replace(/<style[^>]*>(.|\n)*?<\/style>/ig,"");
	s = s.replace(/\'/g, "&#39");
	s = s.replace(/\"/g, "&quot;");
	s = s.replace(/\n/g, "<br>");
	return s;
} 