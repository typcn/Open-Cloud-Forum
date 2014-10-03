AV.Cloud.beforeSave("topic", verifyUser);
AV.Cloud.beforeSave("reply", verifyUser);

function verifyUser(request,response){
	if(!request.user){
		response.error("Not logged!");
	}
	
	query = new AV.Query(AV.User);
	query.get(request.object.get("user").id, {
		success: function(user) {
			if(user.get("emailVerified") == false){
				response.error("Email not verified!");
			}else{
				response.success();
			}
		},
		error: function(error) {
		  throw "Got an error " + error.code + " : " + error.message;
		  response.error("Unknow Error!");
		}
	});
}
