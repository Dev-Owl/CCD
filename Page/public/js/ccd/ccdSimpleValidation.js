

function validateChilds(element){
  var result =true;
  $(element).find('[data-validation]').each(function(i) {

    //No validation for disabled elements
    if($(this).prop("disabled")){
      $(this).parent().removeClass('has-error');
      return;
    }


    var valType = $(this).data('validation');

    if( valType === 'required'){
      if(!$(this).val()){
         replaceClass('has-success','has-error',$(this).parent());
         result = false;
      }
      else{
        replaceClass('has-error','has-success',$(this).parent());
      }
    }
  });
  return result;
}

function replaceClass(find,replace,element){
  $(element).removeClass(find);
  $(element).addClass(replace);
}
