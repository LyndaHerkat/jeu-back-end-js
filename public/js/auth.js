'use strict';

window.addEventListener('DOMContentLoaded', function () {

    /**Formulaire d'inscription **/

    var $signInForm = $('#signin-form');
    var $signInID = $('#signin-id');
    var $signInPassword = $('#signin-password');
    var formValidation = false;
    var idValidation;
    var passwordValidation;

    $signInID.focus(function (e) {
        $('#signin-id + p').hide().removeClass('error');
    });
    $signInPassword.focus(function (e) {
        $('#signin-password + p').hide().removeClass('error');
    });

    $signInForm.submit(function (e) {

        //Requete ajax pour verifier l'absence du nouvel identifiant dans la base de données.
        let tabUsers = [];        

        if (formValidation === false) {

            e.preventDefault();

            $.ajax({
                type: 'get',
                url: '/inscription/check',
                async: false,
                success: function (data) {
                    console.log('data : ', data);
                    $.each(data, function (index) {
                        $.each(this, function (key, value) {
                            tabUsers.push(value);
                        });
                        console.log("TCL: tabUsers", tabUsers)
                    });
                }
            });

            //Vérification des identifiants et mot de passe de connexion
            if ($signInID.val().length < 5 || $signInID.val().length > 20) {
                $('#signin-id + p.messageSignin').show().addClass('error').text('Veuillez entrer un identifiant comprenant 5 à 20 caractères');
                idValidation = false;
            } else {
                if (tabUsers.indexOf($signInID.val()) != -1) {
                    $('#signin-id + p.messageSignin').show().addClass('error').text('Cet identifiant existe déjà. Veuillez en selectionner un autre.');
                    idValidation = false;

                } else {
                    idValidation = true;
                }
            }

            if ($signInPassword.val().length < 5 || $signInPassword.val().length > 20) {
                $('#signin-password + p.messageSignin').show().addClass('error').text('Veuillez entrer un mot de passe comprenant 5 à 20 caractères');
                passwordValidation = false;
            } else {
                passwordValidation = true;
            }

            if (idValidation && passwordValidation) {
                formValidation = true;
            }
            console.log("TCL: formValidation", formValidation);

            if (formValidation) {

                // console.log('Formulaire valide');
                // console.log("TCL: this", this)
                // $signInForm.submit();
            }
        }

    });

});