$('form#main').submit(function (e) {
    e.preventDefault();
    if ($(this).validInput()) {
        return;
    }


    if ($(this).find('button').hasClass('new')) {
        AddUser($('input#email').val(), $('input#password').val());
    } else {
        Login($('input#email').val(), $('input#password').val());
    }
});



$('a#new-account').click(function () {
    CreateAccount();
});



function Login(user, pass) {

    $.ajax({
        url: 'users/login',
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            user: user,
            passHash: pass
        }),
        statusCode: {
            204: function (e) {
                Error('Username doesn\'t exist. Please create an account.');
            },
            200: function (e) {
                Message('Correct!');
                Initiate(e);
            },
            206: function (e) {
                Error('Password incorrect. Please try again.')
            }
        }
    });

}


function WrongInfo() {
    Error('Incorrect email/password combination.');
}


function AccountOff() {
    Error('Please contact your administrator for access.');
}

function Initiate(data) {

    console.log(data);

    SetCookie("id", data._id, 1);

    $('div#login').animate({
        left: "-200px"
    }, 500, function () {
        document.location.href = "/game";
    });

}


function Error(message) {
    $('div#error').html(message).slideDown('fast');
}

function Message(message) {
    $('div#message').html(message).slideDown('fast');
}

function CreateAccount() {
    $('button#login-submit').html('Create Account').addClass('new');
    $('a#new-account').fadeOut('fast');
    $('div.panel-footer').slideUp('fast');
}

function AddUser(user, pass) {

    $.ajax({
        url: 'users/add',
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            user: user,
            passHash: pass
        }),
        statusCode: {
            204: function (e) {
                Error('Username already exists. Please choose a new one.');
            },
            200: function (e) {
                Message('Account Created!');
                setTimeout(function () {
                    Initiate(e);
                }, 1000);
            }
        }
    });

}

$.fn.validInput = function () {
    var check = false;

    $(this).find('input').each(function () {
        $(this).closest('div').removeClass('has-error');
        if ($(this).val() == '') {
            $(this).closest('div').addClass('has-error');
            check = true;
        }
    });

    $(this).find('select').each(function () {
        $(this).closest('div').removeClass('has-error');
        if ($(this).find('option:selected').attr("class")) {
            $(this).closest('div').addClass('has-error');
            check = true;
        }
    });

    $(this).find('textarea').each(function () {
        $(this).closest('div').removeClass('has-error');
        if ($(this).val() == '') {
            $(this).closest('div').addClass('has-error');
            check = true;
        }
    });

    return check;
}

function SetCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = name + "=" + value + expires + ";";
}

function GetCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) {
        return parts.pop().split(";").shift();
    }
}