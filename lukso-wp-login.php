<?php
/*
* Plugin Name: Lukso WP Login
* Telegram: @taketimeout
* Description: WordPress authentication using the Lukso UP Browser Extension
* Version: 0.1
* Author: Luksoverse
* Author URI: https://luksoverse.io/
*/
 
function lukso_wp_login_init() {
	
    $path = "/frontend/build/static";
    if(getenv('WP_ENV')=="development") {
        $path = "/frontend/build/static";
    }
	
    wp_register_script("lukso_wp_login_js", plugins_url($path."/js/main.3495a53b.js", __FILE__), array(), "1.0", false);
    wp_register_style("lukso_wp_login_css", plugins_url($path."/css/main.7a6bb05e.css", __FILE__), array(), "1.0", "all");
	
}

add_action( 'init', 'lukso_wp_login_init' );


add_action('admin_menu', 'lukso_menu');

function lukso_menu() { 

  add_menu_page( 
      'Login with UP', 
      'Connect UP', 
      'read', 
      'profile.php#connect', 
      '', 
      'dashicons-admin-network' 

     );
}

// Function for calling app but with the register class set
add_shortcode('lukso_wp_register', 'lukso_wp_register');

function lukso_wp_register() {
	

	
    wp_enqueue_script("lukso_wp_login_js", '1.0', true);
    wp_enqueue_style("lukso_wp_login_css", "1.0", true);
    return "<div class=\"register\" id=\"lukso_wp_login\"></div>";
	
}

// Function for the short code that call React app
add_shortcode('lukso_wp_login', 'lukso_wp_login');

function lukso_wp_login() {
	
	wp_enqueue_script('lukso_wp_login_js', 'lukso_wp_login_js','false','1.0',true);
    //wp_enqueue_script("lukso_wp_login_js", '1.0', true);
    wp_enqueue_style("lukso_wp_login_css", 'lukso_wp_login_js','false','1.0',true);
    return "<div id=\"lukso_wp_login\"></div>";
	
}

add_action( 'login_form', 'sign_in_with_lukso' );

function sign_in_with_lukso( $input = '' ) {
	
	wp_enqueue_script("lukso_wp_login_js", '1.0', true);
    wp_enqueue_style("lukso_wp_login_css", '1.0', true);
	?>
    <div id="lukso_wp_login"></div>
	
	<?php
   
}
add_action( 'wp_ajax_nopriv_get_data', 'get_data' );
add_action( 'wp_ajax_get_data', 'get_data' );

function get_data(  ) {
	
	$mode = 2; // In login mode, unless otherwise stated.
	
	$address = $_POST['address'];
	//$nonce = sanitize($_POST['nonce']);
	$signature = $_POST['signature'];
	
	//$address = json_decode($address);
	//echo $address;

	/* method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ publicAddress, signature })
	*/



	$url = "https://uplogin-auth.luksoverse.io/auth";
	$ch = curl_init( $url );
	# Setup request to send json via POST.
	$payload = json_encode( array( "publicAddress"=> $address, "signature"=> $signature ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	# Return response instead of printing.
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt( $ch, CURLOPT_CUSTOMREQUEST, "POST" );
	# Send request.
	$result = curl_exec($ch);

	# Print response.
	//echo "<pre>$result</pre>";



  
	$err = curl_error($ch);
	curl_close($ch);
	if ($err) {
	//Only show errors while testing
	//echo "cURL Error #:" . $err;
	echo $err;
	} else {
	//The API returns data in JSON format, so first convert that to an array of data objects
	$responseObj = json_decode($result);
	//Gather the air quality value and timestamp for the first and last elements
	//print_r( $responseObj);

	}
  
	if ( $responseObj->verified == 1 ) {
	
		$user_added = false;
		
		if ( is_user_logged_in() ) {
			
			$mode = 1;
			
			$user = wp_get_current_user();
			
			global $wpdb;
		$user_meta = $wpdb->get_results("SELECT user_id FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login' AND user_id = {$user->ID}");
		
		
			
			
			
			if ( isset( $user->ID ) && sizeof( $user_meta ) == 0 ) {
				
				
			
				$user_added = add_user_meta( $user->ID, 'lukso_login', $address);
			//$user_added = "no";
			}
			
		} else if ( !is_user_logged_in() ) {
			
			
		
			global $wpdb;
			$user_meta = $wpdb->get_results("SELECT user_id FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login' AND meta_value = '{$address}'");
			
			
			
			//print_r($user);
			//echo $user[0]->user_id;
			
			
			if ( $user_meta ) {
				$user = get_user_by( 'id', $user_meta[0]->user_id );
			}
			//print_r($user);
			if ( ! $user_meta ) {
				
				$status_message = "No asociated address, correct profile? Try logging in normally and check you have asociated your UP profile properly.";
				
				$return = array(
				'verified'  => 0,
					'admin'       => false,
					'added'	=> $user_added,
					'mode' => $mode,
					'message' => $status_message
				
			);
			
			
			//$return = json_encode($return);
			wp_send_json($return);
			} else if ( $user->ID >= 0 ) {
				
				$profileAvatar = $wpdb->get_results("SELECT meta_value FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login_avatar' AND user_id = {$user->ID}");
		
		
				//$user = wp_get_current_user();
				$roles = ( array ) $user->roles;
				
				if (in_array("subscriber", $roles)) {
					$admin = false;
				} else {
					$admin = true;
				}
				
				
				
				clean_user_cache( $user->ID );
				wp_clear_auth_cookie();
				//wp_logout();
				//wp_destroy_current_session();

				wp_set_current_user( $user->ID );
				wp_set_auth_cookie( $user->ID, false );
				update_user_caches( $user );

				do_action( 'wp_login', $user->data->user_login, $user );
				
				
				
			
				
				
			} 
		

		}
		
		if($user_added == true){
			$status_message = "UP Profile has successfully been asociated with this WordPress account. Now you can use this profile to login.";
		}
		$return = array(
				'verified'  => 1,
				'admin'       => $admin,
				'added'	=> $user_added,
				'mode' => $mode,
				'profileAvatar' => $profileAvatar,
				'message' => $status_message
			);
			//$return = json_encode($return);
		wp_send_json($return);
		
		wp_die();  //die();
		
	}

	wp_die();  //die();

} // End get_data



add_action( 'wp_ajax_getUserStatus', 'getUserStatus' );
add_action( 'wp_ajax_nopriv_getUserStatus', 'getUserStatus' );

// Check whether user has already asociated their UP profile with WP account
function getUserStatus () {
	
	// First check if they are logged in as an extra barrier against abuse
	if ( is_user_logged_in() ) {
		
		$user = wp_get_current_user();
			
		global $wpdb;
		$user_meta = $wpdb->get_results("SELECT user_id FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login' AND user_id = {$user->ID}");
		
		// Works for now - Could be a better way to check if we have a user that has already connected...
		if ( isset( $user->ID ) && sizeof( $user_meta ) > 0 ) {
			
			
			$avatar_url = get_avatar_url( $user->ID );
			$avatar_url = $wpdb->get_results("SELECT meta_value FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login_avatar' AND user_id = {$user->ID}");
			$avatar_url = $avatar_url[0];
			
			// User exists Speaks for itself- used in front end to set button state etc.
			$return = array(
				'userExists'	=> true,
				'profileConnected' => true,
		'avatarURL' => $avatar_url->meta_value,
				'username' => $user->user_login
			);
			//$return = json_encode($return);
			wp_send_json($return);
			
			wp_die();  //die();
			
			
		} else if ( isset($user->ID) && sizeof( $user_meta ) == 0 ) {
			
			$avatar_url = get_avatar_url( $user->ID );
			$avatar_url = $wpdb->get_results("SELECT meta_value FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login_avatar' AND user_id = {$user->ID}");
			$username = $user->user_login;
			$avatar_url = $avatar_url[0];
			
			$return = array(
				'userExists'	=> true,
				'profileConnected' => false,
				'avatarURL' => $avatar_url->meta_value,
				'username' => $username
			);
			//$return = json_encode($return);
			wp_send_json($return);
			
			wp_die();  //die();
			
		}
		
	} else {
		$return = array(
				'userExists'	=> false
			);
			//$return = json_encode($return);
			wp_send_json($return);
			
			wp_die();  //die();
	}
	
	
}


add_action( 'wp_ajax_remove_user', 'remove_user' );
add_action( 'wp_ajax_nopriv_remove_user', 'remove_user' );

// Removes user UP profile from usermeta table - Disconnects UP profile from WP
function remove_user () {
	
	$mode = 3;

	if ( is_user_logged_in() ) {
	
		$user = wp_get_current_user();
			
		global $wpdb;	
		
		$result = $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login' AND user_id = {$user->ID}" ) );
		
		if ( isset( $user->ID ) && $result == true ) {
			
			
			
			
				$return = array(
				'verified'  => 0,
				'admin'       => false,
				'added'	=> false,
				'mode' => $mode,
				'message' => $status_message
			);
			
			wp_send_json($return);
			
			wp_die();  //die();
			
			
		} else {
			
			$status_message = "There was an error removing your UP profile from this account. Please try refreshing the page and trying again. If that fails, contact the website administrator.";
			
			$return = array(
				'verified'  => 0,
				'admin'       => false,
				'added'	=> false,
				'error' => 1,
				'mode' => $mode,
				'message' => $status_message
			);
			
			wp_send_json($return);
			
			wp_die();  //die();
			
		}
	
	}

} // End remove_user






// Register new user
add_action( 'wp_ajax_registerUser', 'registerUser' );
add_action( 'wp_ajax_nopriv_registerUser', 'registerUser' );

function registerUser () {
	
	$address = $_POST['address'];
	//$nonce = sanitize($_POST['nonce']);
	$signature = $_POST['signature'];
	$username = $_POST['username'];
	$profileAvatar = $_POST['profileAvatar'];
	
	//$address = json_decode($address);
	//echo $address;

	/* method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ publicAddress, signature })
	*/



	$url = "https://uplogin-auth.luksoverse.io/auth";
	$ch = curl_init( $url );
	# Setup request to send json via POST.
	$payload = json_encode( array( "publicAddress"=> $address, "signature"=> $signature ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	# Return response instead of printing.
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt( $ch, CURLOPT_CUSTOMREQUEST, "POST" );
	# Send request.
	$result = curl_exec($ch);

	# Print response.
	//echo "<pre>$result</pre>";



  
	$err = curl_error($ch);
	curl_close($ch);
	if ($err) {
	//Only show errors while testing
	//echo "cURL Error #:" . $err;
	echo $err;
	} else {
	//The API returns data in JSON format, so first convert that to an array of data objects
	$responseObj = json_decode($result);
	//Gather the air quality value and timestamp for the first and last elements
	//print_r( $responseObj);

	}
  
	if ( $responseObj->verified == 1 ) {
	
	
	
	
	
	
	//$user_id = username_exists( $username );
	global $wpdb;
	$user_meta = $wpdb->get_results("SELECT user_id FROM {$wpdb->prefix}usermeta WHERE meta_key = 'lukso_login' AND meta_value = '{$address}'");
			
			// Works for now - Could be a better way to check if we have a user that has already connected...
			
	 
	if ( sizeof( $user_meta ) == 0 ) {
    $random_password = wp_generate_password( $length = 12, $include_standard_special_chars = true, $include_standard_special_chars = true );
    $user_id = wp_create_user( $username, $random_password );
	
	//echo $user_id;
	
	
	if ( isset( $user_id ) ) {
		
		$user = get_user_by( 'id', $user_id );
		//print_r($user);
	
		$user_added = add_user_meta( $user->ID, 'lukso_login', $address);
		$avatar_added = add_user_meta( $user->ID, 'lukso_login_avatar', $profileAvatar);
				
				clean_user_cache( $user->ID );
				wp_clear_auth_cookie();
				//wp_logout();
				//wp_destroy_current_session();

				wp_set_current_user( $user->ID );
				wp_set_auth_cookie( $user->ID, false );
				update_user_caches( $user );

				do_action( 'wp_login', $user->data->user_login, $user );
				
				
				
				
				
	
		$return = array(
				'verified'  => 1,
				'admin'       => false,
				'addressExists' => false,
				'added'	=> 1
			);
			
			wp_send_json($return);
			
			wp_die();  //die();
		
	} else {
		$return = array(
				'verified'  => 1,
				'admin'       => false,
				'addressExists' => false,
				'added'	=> 0
			);
			
			wp_send_json($return);
			
			wp_die();  //die();
	}
	
	
} else {
    $return = array(
				'verified'  => 1,
				'admin'       => false,
				'addressExists' => true,
				'added'	=> 0,
				'status_message' => 'It looks like you have already connected this UP to another WordPress account, please use the login function.'
			);
			
			wp_send_json($return);
			
			wp_die();  //die();
}



	wp_die();
	
	
		
	
		
		
	}
	
}

add_action( 'wp_ajax_checkUsername', 'checkUsername' );
add_action( 'wp_ajax_nopriv_checkUsername', 'checkUsername' );

function checkUsername () {
	
	$username = $_POST['username'];
	
	if ( username_exists ( $username ) ) {
		
		$return = array(
				'user_exists' => true
			);
		
	} else {
		
		$return = array(
				'user_exists' => false
			);
		
	}
	wp_send_json($return);
			
	wp_die();  //die();
	
}


function wpdocs_lukso_user_profile_fields( ) {

	sign_in_with_lukso();

}
add_action( 'show_user_profile', 'sign_in_with_lukso' );
add_action( 'edit_user_profile', 'sign_in_with_lukso' );

