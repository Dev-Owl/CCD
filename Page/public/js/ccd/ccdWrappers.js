

//---------------------------_Notify Wrappers ---------------------------------
//Shows info message to the user
function InfoMe(Title,Text){
    return __notification(Title,Text,5000,'info',true);
}

//warning message to the user no auto fade out
function WarnMe(Title,Text){
  return __notification(Title,Text,5000,'warning',true);
}

//warning message to the user no auto fade out
function ErrorMe(Title,Text){
  return WaitMe(Title,Text,'danger',true);
}

function WaitMe(Title,Text,Type,AllowClose,Progress){
  return __notification(Title,Text,0,Type,AllowClose,Progress);
}

function __notification(Title,Text,AutoDismiss,Type,AllowClose,Progress){

  return $.notify({
              title:Title,
              message:Text
             },
             {
              allow_dismiss: AllowClose,
              delay:AutoDismiss,
              type:Type,
              showProgressbar: Progress,
              animate: {
                    enter: 'animated flipInY',
                    exit: 'animated flipOutX'
                   },
                   placement: {
                          from: "bottom",
                          align: "center"
                        }

             });

}
//---------------------------_Notify Wrappers ---------------------------------
