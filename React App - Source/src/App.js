import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import Web3 from 'web3';

import { ERC725 } from '@erc725/erc725.js';

import erc725schema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
import Modal from 'react-modal';
require ( 'isomorphic-fetch' );


// Our static variables
const RPC_ENDPOINT = 'https://rpc.l16.lukso.network';
const IPFS_GATEWAY = 'https://2eff.lukso.dev/ipfs/';

// Parameters for ERC725 Instance
const provider = new Web3.providers.HttpProvider(RPC_ENDPOINT);
const config = { ipfsGateway: IPFS_GATEWAY };

const web3 = new Web3(window.ethereum);

var runOnce = 1;

//console.log(web3);

function App() {
	
  const [account, setAccount] = useState(undefined);
  const [username, setUsername] = useState({
  username: undefined
  }
  );
  
  const [profileAvatar, setProfileAvatar] = useState({
  profileAvatar: undefined
  }
  );
  
  const [data, setData] = useState({
    updated: false,
    nonce: undefined,
    signature: undefined
  });
  const [verificationData, setVerificationData] = useState({
	  verified: undefined
  });
  
  const [status, setStatus] = useState ({
	 message: undefined,
	 colour: undefined	  
  });
  
  const [registrationStatus, setRegistrationStatus] = useState ({
	 message: undefined,
	 colour: undefined	  
  });

  const [buttonType, setButtonType] = useState({
	  login_connect_remove: "Login with Universal Profiles",
	  mode: 2,
	  connect: 1,
	  username: '',
	  profileAvatarURL: ''
  });

  var uri = window.location.pathname;
  var hostname = window.location.hostname;
  var overlay = document.getElementsByClassName(".mfp-bg.mfp-zoom-out.mfp-ready");
  
  const [firstClick, setFirstClick] = useState(1);
  //var usernameInvalid = true;
  const [usernameInvalid, setInvalid] = useState(true);
  
  
  const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
	minWidth: '307px'
  },
};



/***************

Run once - useEffect

****************/

 useEffect(() => {
	 
	 
  runOnce = 0;
  
  Modal.setAppElement('#lwpupl_login');
  
  // Check if we are on the profile page for WordPress
  if ( uri == "/wp-admin/profile.php" ) {

   // user status relies on promises, so we use async
   document.getElementById("register").style.display = "none";
   document.getElementById("connect").style.width = "369px";
   document.getElementById("connect").style.height = "40px";
   
   const userStatus = async () => {
		
	var dataSend = new FormData();

    //console.log(uri);


    // lwpupl_getUserStatus will check if the user has connected their UP profile to their account
	dataSend.append( 'action', 'lwpupl_getUserStatus' );
	
	const res = await fetch('/wp-admin/admin-ajax.php', {
		method: 'POST',
		body: dataSend,
		credentials: 'same-origin'
	})
		.then(response => response.json())
		.then((res) => {
		  

			// console.log("This 1: " + res.userExists);

			// if the user has connected their profile to WP account then they will be displayed the disconnect button
			// Mode will be set to 1 to be used later on if they click disconnect,
			// this will indicate to later function we will run through the remove routine
			if ( res.profileConnected == true ) {
			  
			  //console.log("This 2: " + res);
			  
			  setButtonType ({ login_connect_remove: "Disconnect UP Profile", mode: 1, connect: 0});
			  
			  document.getElementById("connect").style.backgroundImage = `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_disconnect.png'})`;

			} else {
			  
			  setButtonType ({ login_connect_remove: "Connect UP Profile", mode: 2 });
			  
			  document.getElementById("connect").style.backgroundImage = `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_login.png'})`;
			  
			  //console.log("This 3: " + res);
			  
			}
		
		});
		  
	  }
	  
	  
	userStatus();
	  
	  
		
  } else if ( (!uri.includes("wp-admin") && !uri.includes("wp-login")) && ( window.location.hostname == "luksoverse.io"  || hostname == "staging.luksoverse.io"  || hostname == "localhost" ) ) { // end if uri is profile
  
	const userStatus2 = async () => {
		
	var dataSend = new FormData();

    //console.log(uri);


    // lwpupl_getUserStatus will check if the user has connected their UP profile to their account
	dataSend.append( 'action', 'lwpupl_getUserStatus' );
	
	const res = await fetch('/wp-admin/admin-ajax.php', {
		method: 'POST',
		body: dataSend,
		credentials: 'same-origin'
	})
		.then(response => response.json())
		.then((res) => {
		  

				// console.log("This 1: " + res.userExists);

			// if the user has connected their profile to WP account then they will be displayed the disconnect button
			// Mode will be set to 1 to be used later on if they click disconnect,
			// this will indicate to later function we will run through the remove routine
			if ( res.userExists == true ) {
			  
			  //console.log("This 2: " + res);
			  
			  setButtonType ({ login_connect_remove: "", mode: 2, connect: 0, username:res.username , profileAvatarURL: res.avatarURL });

			} else {
			  
			  setButtonType ({ login_connect_remove: "", mode: 2 });
			  
			  //console.log("This 3: " + res);
			  
			}
			

		
		});
		  
	  }
	  
	  userStatus2();
		  
	}
  
  
  
  
	  
}, []); // End UseEffect



async function fetchProfile(address) {
  try {
    const profile = new ERC725(erc725schema, address, provider, config);
    return await profile.fetchData();
  } catch (error) {
      return console.log('This is not an ERC725 Contract');
  }
}

/*
 * Fetch the @param's Universal Profile's
 * LSP3 data
 *
 * @param address of Universal Profile
 * @return string JSON or custom error
 */
async function fetchProfileData(address) {
  try {
    const profile = new ERC725(erc725schema, address, provider, config);
    return await profile.fetchData('LSP3Profile');
  } catch (error) {
      return console.log('This is not an ERC725 Contract');
  }
}

async function lwpupl_checkUsername(username) {

	//console.log(username.username);
	var tempUsername = document.getElementById("UPusername").value;
	console.log(tempUsername);
	var dataSend = new FormData();
	dataSend.append( 'username', tempUsername );
	dataSend.append( 'action', 'lwpupl_checkUsername' );
	
	const res = await fetch('/wp-admin/admin-ajax.php', {
			method: 'POST',
			body: dataSend,
			credentials: 'same-origin'
		})
      .then(response => response.json());
	
	if ( res.user_exists == true ) {
		document.getElementById("UPusername").classList.add('error');
		setRegistrationStatus ( { message: "This username already exists. Please try another.", colour: 'red' } );
		// Disable go button
	} else if ( res.addressExists ) {

		document.getElementById("UPusername").classList.add('error');
		setRegistrationStatus ( { message: "<p>The Universal Profile you have chosen is already asociated with an account on this website.</p><p>Go back to the login area and try to log in!</p>", colour: 'red' } );

	}		else {
			document.getElementById("UPusername").classList.add('validated');
			setRegistrationStatus ( { message: "This username is available to use, click register to continue.", colour: 'green' } );
	}
	
setInvalid (  res.user_exists, () => console.log(usernameInvalid) );

	
	

}	


/*async function checkForExtension ( ) {

	  const accounts = await web3.eth.requestAccounts();
	  console.log(accounts);
	  
}*/


async function lwpupl_registerUser ( ) {


  /*var isRegister = uri.includes("#Register");
  
  if ( isRegister ) {
	  
	  
	  
  }*/
  
//console.log(firstClick);
//console.log(usernameInvalid);
  var tempUsername = '';
  if ( firstClick == 1 ) {
	  
	  setFirstClick ( 0 );
	  const accounts = await web3.eth.requestAccounts();
	  setAccount(accounts[0]);
	  const signature = await sign(accounts[0]);
	  //console.log(accounts);
		
	  var dataSend = new FormData();
		
	  fetchProfile(accounts[0]).then(async(profileData) => {
		
		  setUsername(profileData[1].value.LSP3Profile.name);
		  
		  var tempAvatar = profileData[1].value.LSP3Profile.profileImage[4].url;
		  var tempAvatar = tempAvatar.substring(7);
		  setProfileAvatar({profileAvatar: tempAvatar});
		  console.log(tempAvatar);
		//await verifySignature(accounts[0], data.signature, signature);
	  
	   
	   
		setAccount(accounts[0]);
	   
	   
	    setData({ updated: true, nonce: '', signature });

	  
	  
	  
	  
	  
		
		tempUsername = profileData[1].value.LSP3Profile.name;
		if ( tempUsername == null || tempUsername == undefined || tempUsername == '' ) {
			
			document.getElementById("UPusername").classList.add('error');
			
		} else {
			
			document.getElementById("UPusername").value = tempUsername;
			lwpupl_checkUsername();
			if ( usernameInvalid == false ) {
					var dataSend = new FormData();
				dataSend.append( 'username', tempUsername );
				dataSend.append( 'signature', data.signature );
				dataSend.append( 'address', account );
				dataSend.append( 'profileAvatar', tempAvatar );
				dataSend.append( 'action', 'lwpupl_registerUser' );
				
				const res = await fetch('/wp-admin/admin-ajax.php', {
					method: 'POST',
					body: dataSend,
					credentials: 'same-origin'
				})
			  .then(response => response.json());
			  
			  if ( res.added == 0 ) {
				  
				  setStatus ( { message: "There was an issue registering you here.", colour: 'red' } );
				  
			  } else {
				  
				  setStatus ( { message: "Success!", colour: 'green' } );
				  
			  }
			}
			
		}
		
		
	
	});
	
	
	
  } else if ( firstClick == 0 && usernameInvalid == false ) {


		/*const accounts = await web3.eth.requestAccounts();
		setAccount(accounts[0]);
		const signature = await sign(accounts[0]);
		//console.log(accounts);
		
		var dataSend = new FormData();
		
		fetchProfile(accounts[0]).then(async(profileData) => {
		
	  setUsername(profileData[1].value.LSP3Profile.name);
	  
	  var tempAvatar = profileData[1].value.LSP3Profile.profileImage[4].url;
	  var tempAvatar = tempAvatar.substring(7);

	  setData({ updated: true, nonce: '', signature });*/
		
	  tempUsername = document.getElementById("UPusername").value;
		
		var dataSend = new FormData();
		dataSend.append( 'username', tempUsername );
		dataSend.append( 'signature', data.signature );
		dataSend.append( 'address', account );
		dataSend.append( 'profileAvatar', profileAvatar.profileAvatar );
		dataSend.append( 'action', 'lwpupl_registerUser' );
		
		const res = await fetch('/wp-admin/admin-ajax.php', {
			method: 'POST',
			body: dataSend,
			credentials: 'same-origin'
		})
      .then(response => response.json());
	  
	  if ( res.added == 0 ) {
		  
		  setStatus ( { message: "There was an issue registering you here.", colour: 'red' } );
		  setRegistrationStatus ( { message: res.status_message, colour: 'red !important' } );
		  
	  } else {
		  
		  setStatus ( { message: "Success!", colour: 'green' } );
		  if ( window.location.hostname == "luksoverse.io" || window.location.hostname  == "staging.luksoverse.io"  || window.location.hostname  == "localhost") {
			  
			  if ( res.admin == false ) {
			  window.location.assign(process.env.PUBLIC_URL + '/');
			  } else {
				window.location.assign(process.env.PUBLIC_URL + '/team-login');
			  }
			  
		  } else {
			  window.location.assign(process.env.PUBLIC_URL + '/wp-admin')
		  }
		  
	  }
	  
		//});//end fetch
		
	}

}	

 


  // Connect button fires off series of events
  const connect = async () => {
    const accounts = await web3.eth.requestAccounts();
	setAccount(accounts[0]);
	const signature = await sign(accounts[0]);
	//console.log(accounts);
	
	
	fetchProfile(accounts[0]).then((profileData) =>
	
    console.log(profileData[1].value.LSP3Profile.name),
);

// Step 2
/*fetchProfileData(accounts[0]).then((profileData) =>
  console.log(JSON.stringify(profileData, undefined, 2));
  console.log(profileData),
);*/
	
	//console.log(signature);
	//console.log(data.signature);
	await verifySignature(accounts[0], data.signature, signature);
  }
  
  
  
  const getNonce = async (publicAddress) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicAddress })
    };
    const nonce = await fetch('https://uplogin-auth.luksoverse.io/nonce', requestOptions)
      .then(response => response.json())
      .then(data => data["nonce"]);
    return nonce;
  }
  
  
  const signNonce = async (publicAddress, nonce) => {
    const res = await web3.eth.sign(`${nonce}`, publicAddress);
	return res.signature;
  }
  
  const sign = async (publicAddress) => {
    const nonce = await getNonce(publicAddress);
    const signature = await signNonce(publicAddress, nonce);
	//console.log(signature);
	setData({ updated: true, nonce, signature });
	return signature;
	//console.log(data.signature);
  }
  
  
  const getData = async (publicAddress, signature) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
				
	  },
      body: JSON.stringify({ publicAddress, signature })
    };
	
	const res = await fetch('https://uplogin-auth.luksoverse.io/auth', requestOptions)
      .then(response => response.json());
    setVerificationData({ ...res });
  }
  
  
  const verifySignature = async (publicAddress, signature, signature2) => {
	  
	var dataSend = new FormData();

	if ( buttonType.mode == 1 ) {
		
		dataSend.append( 'action', 'lwpupl_remove_user' );
		dataSend.append( 'removeAddress', 1 );
		
		
	} else if ( buttonType.mode == 2 ) {
		
		dataSend.append( 'action', 'lwpupl_get_data' );
		
	}

	
	dataSend.append( 'address', publicAddress );
	dataSend.append( 'signature', signature2 );
	
	const res = await fetch('/wp-admin/admin-ajax.php', {
			method: 'POST',
			body: dataSend,
			credentials: 'same-origin'
		})
      .then(response => response.json());

    setVerificationData({ ...res });
	
	
	/**********************
	
	Everything below is to do with checks on statuses
	It could probably be simplified, but for now it works
	Some of the status flags and modes are used to change the UP button
	depending on what page it is being displayed on
	
	buttonType.connect is set to 1 by default, if it is set to 0 that means we haven't got a connected UP profile
	res.mode what mode we are working in, add, login or remove
	res.verified whether the user verified their UP account 0 = not verified, 1 = verified
	res.added - whether the UP account was added to the WP user or not
	
	************************/
	
	// If the user is logged in but needs to add their UP account
	if ( buttonType.connect == 0 && res.mode == 3 && res.verified == 0 && res.added == false ) {
		
		setButtonType ({ login_connect_remove: "Connect UP Profile", mode: 2 });
		setStatus ( { message: "Universal Profile has been disconnected from this WordPress account.", colour: 'green' } );
		
		document.getElementById("connect").style.backgroundImage = `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_login.png'})`;
		
	// If the user is logged in and have already added their UP account	
	} else if (  res.mode == 1 && res.verified == 1 && res.added > 0  ) {
	
	
		setButtonType ({ login_connect_remove: "Disconnect Up Profile", mode: 1 });
		setStatus ( { message: "Universal Profile has been connected to this WordPress account.", colour: 'green' } );
		
		document.getElementById("connect").style.backgroundImage = `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_disconnect.png'})`;
		
		
    }
	
			  
			  

	//console.log(res);
	if ( res.verified && res.added == false && res.mode == 2 ) {
		window.location.assign(process.env.PUBLIC_URL + '/wp-admin');
		setStatus ( { message: "Success!", colour: 'green' } );
	} else if ( res.verified == 0 && res.mode == 2 ) {
		setStatus ( { message: "Your UP profile is not registered here.", colour: 'red' } );
	} else if ( res.verified == 1 && res.added == false & res.mode == 1 ) {
		
		setStatus ( { message: "There was an issue asociating your profile with this account. Are you using the Lukso UP browser extension? If not, please install this first and create a profile. Then try again.", colour: 'red' } );
		
	} else if ( res.mode == 3 && res.error == 1 ) {
		
		setStatus ( { message: res.status_message, colour: 'red' } );
		
	}
  } // end verify signature
  
    let subtitle;
  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
	lwpupl_registerUser();
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    //subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }




//document.getElementsByClassName("register-h1").style.color("black");
//console.log(hostname);
//console.log(uri);
//console.log(buttonType.username);
//console.log(buttonType.profileAvatarURL);
if ( ( hostname == "luksoverse.io" || hostname == "staging.luksoverse.io" || hostname  == "localhost") && (!uri.includes("wp-admin") && !uri.includes("wp-login") )) {

	if ( buttonType.username != '' && buttonType.username != undefined && buttonType.username != null ) {


		if ( runOnce == 1 ) {
			
			var temp = document.getElementById("lwpupl_login");
		  temp.parentNode.classList.add("jeg_nav_account");
		  temp = temp.parentNode;
		  temp.previousElementSibling.remove();
		  
		}
		
		return (
  
  
  
 /* {
          if(isLoggedIn){
            return <button>Logout</button>
          } else{
            return <button>Login</button>
          }
        }*/
  
   
  

  
			<div className="jeg_nav_item jeg_nav_account">
			<ul className="jeg_accountlink jeg_menu sf-js-enabled sf-arrows" style={{touchAction: 'pan-y'}}>
				<li className="">
					<a href="https://luksoverse.io/account" className="logged sf-with-ul">
					{ buttonType.profileAvatarURL != null ? <img src={ 'https://ipfs.io/ipfs/' + buttonType.profileAvatarURL }  className="avatar avatar-22 photo img-rounded" height="22" width="22" loading="lazy" data-pin-no-hover="true" /> :
					
					<img alt="" src="https://secure.gravatar.com/avatar/fdf175e7fb6778af855a777974f98e37?s=22&amp;d=mm&amp;r=g" srcset="https://secure.gravatar.com/avatar/fdf175e7fb6778af855a777974f98e37?s=44&amp;d=mm&amp;r=g 2x" class="avatar avatar-22 photo img-rounded" height="22" width="22" loading="lazy" data-pin-no-hover="true" />
					
					}
					
					{ buttonType.username }
					</a>                    
					<ul><li><a href="https://luksoverse.io/account" className="account">My Account</a></li><li><a href="/wp-login.php?action=logout" className="logout">Logout</a></li></ul>
				 </li>
				</ul>
			</div>
 
		);
  
	} else if ( (( hostname == "luksoverse.io" || hostname == "staging.luksoverse.io" || hostname  == "localhost") && (!uri.includes("wp-admin") && !uri.includes("wp-login") )) && window.ethereum !== undefined ) {
		
		
		if ( runOnce == 1 ) {
			
			var temp = document.getElementById("lwpupl_login");
		  temp.parentNode.classList.add("jeg_nav_account");
		  temp = temp.parentNode;
		  temp.previousElementSibling.remove();
		  
		  if ( overlay !== undefined ) {
	
				
				//overlay.nextElementSibling.style.display = "none";
				//overlay.style.display = "none";
	
			}
		  
		}
		
	return (
	
	
<>
	<div className="jeg_nav_item jeg_nav_account">
    <ul className="jeg_accountlink jeg_menu sf-js-enabled sf-arrows" style={{touchAction: 'pan-y'}}>
        <li><a href="#" onClick={() => connect()} ><i className="fa fa-lock"></i> Login</a></li><li className=""><a href="#" onClick={openModal} ><i className="fa fa-user"></i> Register</a></li>    </ul>
</div>


   <Modal isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Lukso Registration">
		<img style={{ height: '21px', marginBottom: '10px' }} src="/wp-content/plugins/WordUP-Login/frontend/public/choose_a_username.jpg" />
		  <input style={{ color: 'black', backgroundColor: 'white' }} type="text" id="UPusername" class="" onKeyUp={ () => lwpupl_checkUsername() } />
		  <p className='account-data' style={{color: registrationStatus.colour}}>{registrationStatus.message}</p>
          <button 
			style={{ 
		  backgroundImage: `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_register.png'})`,
		  backgroundRepeat: 'no-repeat',
		  width:'100%', 
		  backgroundSize: '100%',
		display: 'block',
		minHeight: '40px',
		maxWidth: '201px',
		backgroundColor: 'transparent'
		  
		}}
		  type="button" onClick={() => lwpupl_registerUser()} className='btn register' alt="Register using UP!"></button>
		  
         
   </Modal>
   
   </>
   
   );
   
  } else {
	  
	  if ( runOnce == 1 ) {
	  
		  var temp = document.getElementById("lwpupl_login");
		  temp.parentNode.classList.add("jeg_nav_account");
		  temp = temp.parentNode;
		  temp.previousElementSibling.remove();
		  
		  if ( overlay !== undefined ) {
	
				
				//overlay.nextElementSibling.style.display = "none";
				//overlay.style.display = "none";
	
			}
	  
	  }
	  
	  return (
	  
	  <div class="jeg_nav_item jeg_nav_account">
    <ul class="jeg_accountlink jeg_menu sf-js-enabled sf-arrows">
        <li class=""><a href="#jeg_loginform" class="jeg_popuplink"><i class="fa fa-lock"></i> Login</a></li><li><a href="#jeg_registerform" class="jeg_popuplink"><i class="fa fa-user"></i> Register</a></li>    </ul>
</div>

	);
	  
  }
  
} else {
	
	if ( window.ethereum !== undefined ) {
	
	return (
	
	 <div className='btn-container'>
   Login with Universal Profiles:<br /><br />
   
      <button type="button" onClick={() => connect()} className='btn connect'
	  
	  id="connect"
	  
	  style={{ 
		  backgroundImage: `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_login.png'})`,
		  backgroundRepeat: 'no-repeat',
		  width:'100%', 
		  backgroundSize: '100%',
		display: 'block',
		minHeight: '40px',
		border: 'none',
		cursor: 'pointer',
		backgroundColor: 'transparent',
		maxWidth: '201px'
		  
		}}
	  
	  alt="Login with UP!"></button>
	  	  
	  <p className='account-data' style={{color: status.colour}}>{status.message}</p>
	  
	  	 <button 

		style={{ 
		  backgroundImage: `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_register.png'})`,
		  backgroundRepeat: 'no-repeat',
		  width:'100%', 
		  backgroundSize: '100%',
		display: 'block',
		minHeight: '40px',
		border: 'none',
		cursor: 'pointer',
		backgroundColor: 'transparent',
		maxWidth: '201px'
		  
		}}

		 type="button" href="#Register" 
          id="register" 
		  onClick={openModal}
         alt="Register With UP!">
          {" "}
          {" "}
        </button>
		

     
   <Modal isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Lukso Registration">
		<h1>Choose a username:</h1>
		  <input type="text" id="UPusername" class="" onKeyUp={ () => lwpupl_checkUsername() } />
		  <p className='account-data' style={{color: registrationStatus.colour}}>{registrationStatus.message}</p>
          <button 
			style={{ 
		  backgroundImage: `url(${process.env.PUBLIC_URL + '/wp-content/plugins/WordUP-Login/frontend/public/lukso_register.png'})`,
		  backgroundRepeat: 'no-repeat',
		  width:'100%', 
		  backgroundSize: '100%',
		display: 'block',
		minHeight: '40px',
		border: 'none',
		maxWidth: '201px',
		backgroundColor: 'transparent'
		  
		}}
		  type="button" onClick={() => lwpupl_registerUser()} className='btn register' alt="Register using UP!"></button>
		  
         
   </Modal>
	  
	</div>
	);
	
	} else {
		
		return (
		
			<div>
			<p>This website is utilising the UP wallet used for self-authenticating. If you are interested in signing into this website using UP, <a href="https://luksoverse.io/WordUP-Login/">follow this link to download the extension</a>.</p><br />
			<p>Once you have installed the extension and created a profile. Come back here and you will be able to register!</p><br />
			
			</div>
		
		);
		
	}
	
	
	
}
  
}

export default App;
