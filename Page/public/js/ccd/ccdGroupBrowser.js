function initGroupBrowser(){

  var table = $('#groups').DataTable({
     "paging":   false,
     "ordering": true,
     "info": false,
     "filter":false,
     "processing": true,
     "serverSide": true,
     "order": [[ 2, "asc" ]],
     "ajax": {
       "url":"/TableGroups",
       "data":function(d){
          d.groupNameFilter = $("#groupName").val();
       }
     },
       "columnDefs": [
            {
              "targets": [ 0 ],
              "visible": false,
              "searchable": false
            },
            {
              "targets": [1],
              "render": function ( data, type, row ) {
                            if(data)
                              return '<span class="glyphicon glyphicon-lock"></span>';

                            return '<span class="glyphicon glyphicon-eye-open"></span>';

                        }
            }
        ]
  });

  $('#groups tbody').on('click', 'tr', function () {
    var data = table.row(this).data();
    var title = data[2];
    if(title.length > 30){
      title = title.substring(0,30)+'...';
    }
    $('#joinRoomTitle').text("Join "+title);

    if(data[1])
      $( "#password" ).prop( "disabled", false );
    else
      $( "#password" ).prop( "disabled", true );

    $('#joinRoom').data("roomID",data[0]);
    $('#joinRoom').modal("show");

  });

  $('#groupName').on('keypress',function(e){
      if(e.which == 13) {
        table.draw();
      }
  });

}
