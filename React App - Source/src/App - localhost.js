import React, { useState, useEffect } from 'react';
import './App.css';

import Web3 from 'web3';
const web3 = new Web3(window.ethereum);






function App() {
  const [account, setAccount] = useState(undefined);
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
  
  







  const [buttonType, setButtonType] = useState({
	  login_connect_remove: "Login with UP!",
	  mode: 2,
	  connect: 1
  });

  const uri = window.location.pathname;

 useEffect(() => {

  if ( uri == "/wp-admin/profile.php" ) {


  const userStatus = async () => {
	  
	  
			
			var dataSend = new FormData();
		
		  //console.log(uri);

			dataSend.append( 'action', 'getUserStatus' );
			
			const res = await fetch('/wp-admin/admin-ajax.php', {
				method: 'POST',
				body: dataSend,
				credentials: 'same-origin'
			})
		  .then(response => response.json())
		  .then((res) => {
			  
	  
		 // console.log("This 1: " + res.userExists);
		  
		  if ( res.userExists == true ) {
			  
			  //console.log("This 2: " + res);
				  
				  setButtonType ({ login_connect_remove: "Disconnect UP Profile", mode: 1, connect: 0});
			  
			  } else {
				  
				  setButtonType ({ login_connect_remove: "Connect UP Profile", mode: 2 });
				  
				  //console.log("This 3: " + res);
				  
			}
			
		  });
		  
		  
  
			
	  }
	  
	  
	  userStatus();
	  
	  
		
  }// end if uri is profile
	  
  }, []); 





 



  const connect = async () => {
    const accounts = await web3.eth.requestAccounts();
	setAccount(accounts[0]);
	const signature = await sign(accounts[0]);
	//console.log(signature);
	//console.log(data.signature);
	await verifySignature(accounts[0], data.signature, signature);

	
	
	/*request1('/dividentList')
.then((res) => {
    //setState for divident
    return request2('/divisorList'); // this will return a promise to chain on
})
.then((res) => {
    setState for divisor
    return Promise.resolve('Success') // we send back a resolved promise to continue chaining
})
.then(() => {
    doCalc logic
})
.catch((err) => {
    console.log('something went wrong');
});*/

	
  }
  
  
  
  const getNonce = async (publicAddress) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicAddress })
    };
    const nonce = await fetch('http://localhost:3001/nonce', requestOptions)
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
    
	//https://up-auth.herokuapp.com/
	
	const res = await fetch('http://localhost:3001/auth', requestOptions)
      .then(response => response.json());
    setVerificationData({ ...res });
  }
  
  
  const verifySignature = async (publicAddress, signature, signature2) => {
	  
	 var dataSend = new FormData();
	
	//console.log(signature);
	//console.log(signature);

		if ( buttonType.mode == 1 ) {
			
			dataSend.append( 'action', 'remove_user' );
			dataSend.append( 'removeAddress', 1 );
			
			
		} else if ( buttonType.mode == 2 ) {
			
			dataSend.append( 'action', 'get_data' );
			
		}

		
		dataSend.append( 'address', publicAddress );
		//dataSend.append( 'signature', signature );
		dataSend.append( 'signature', signature2 );



	
			
	
	
	const res = await fetch('/wp-admin/admin-ajax.php', {
			method: 'POST',
			body: dataSend,
			credentials: 'same-origin'
		})
      .then(response => response.json());

    setVerificationData({ ...res });
	
	if ( buttonType.connect == 0 && res.mode == 3 && res.verified == 0 && res.added == false ) {
		
		setButtonType ({ login_connect_remove: "Connect UP Profile", mode: 2 });
		setStatus ( { message: "UP Profile has been disconnected from this WordPress account.", colour: 'green' } );
		
	} else if (  res.mode == 1 && res.verified == 1 && res.added > 0  ) {
	
	
	setButtonType ({ login_connect_remove: "Disconnect Up Profile", mode: 1 });
	setStatus ( { message: "UP Profile has been connected to this WordPress account.", colour: 'green' } );
	
	
  }


		if ( res.verified && res.added == false && res.mode == 2 ) {
		window.location.replace('/wp-admin')
		setStatus ( { message: "Success!", colour: 'green' } );
	} else if ( res.verified == 0 && res.mode == 2 ) {
		setStatus ( { message: "Your UP profile is not registered here.", colour: 'red' } );
	} else if ( res.verified == 1 && res.added == false & res.mode == 1 ) {
		
		setStatus ( { message: "There was an issue asociating your profile with this account. Are you using the Lukso UP browser extension? If not, please install this first and create a profile. Then try again.", colour: 'red' } );
		
	} else if ( res.mode == 3 && res.error == 1 ) {
		
		setStatus ( { message: res.status_message, colour: 'red' } );
		
	}
  }
  
  

  return (
    
   <div className='btn-container'>
   Login with UP:<br /><br />
      <button type="button" onClick={() => connect()} className='btn connect'>{buttonType.login_connect_remove}</button>
	  	  
	  <p className='account-data' style={{color: status.colour}}>{status.message}</p>
	  
	</div>
     
   
  );
}

export default App;
