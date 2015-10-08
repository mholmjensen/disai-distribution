// OS X: java -cp ".:*" Client
// Windows: java -cp ".;*" Client

import java.io.IOException;
import java.util.LinkedList;
import java.util.HashMap;
import java.util.concurrent.ThreadLocalRandom;

import org.json.JSONObject;

import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;
import com.mashape.unirest.request.HttpRequest;

public class Client {

	public JSONObject sendAction(String endPoint) {
		String url = this.baseUrl + endPoint;
		try {
			HttpRequest response = null;
			if( this.agentToken == null ) {
				response = Unirest.get(url);
			} else {
				response = Unirest.get(url).header("agentToken", this.agentToken);
			}
			return response.asJson().getBody().getObject();
		} catch (UnirestException e) {
			e.printStackTrace();
		}
		throw new RuntimeException("Could not send action " + url + " - is Copenhagent alive?");
	}

	public JSONObject sendAction(String endPoint, String key, String value ) {
		String url = this.baseUrl + endPoint;
		try {
			HttpRequest response = null;
			if( this.agentToken == null ) {
				response = Unirest.get(url).queryString(key, value);
			} else {
				response = Unirest.get(url).header("agentToken", this.agentToken).queryString(key, value);
			}
			return response.asJson().getBody().getObject();
		} catch (UnirestException e) {
			e.printStackTrace();
		}
		throw new RuntimeException("Could not send action " + url + " - is Copenhagent alive?");
	}


	String baseUrl;
	private String agentToken;
	private String agentAt;
	private JSONObject locations;
	private LinkedList<String> locationsList;
	private JSONObject metro;
	private HashMap<String, HashMap<String, Integer>> metroCost;

	public Client(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public void connect( String name ) {
		JSONObject data = this.sendAction("environment/connect", "name", name);
		this.agentToken = data.getString("agentToken");
		System.out.println("Connected and received agentToken: " + this.agentToken);
	}

	public void enterMap() {
		JSONObject data = this.sendAction("map/enter");
		// Parsing
		this.agentAt = data.getJSONObject("state").getJSONObject("agents").getJSONObject(this.agentToken).getString("locationId");
		this.locations = data.getJSONObject("state").getJSONObject("map").getJSONObject("locations");
		this.locationsList = new LinkedList<String>(locations.keySet());
		this.metro = data.getJSONObject("state").getJSONObject("map").getJSONObject("metro");
		this.metroCost = new HashMap< String, HashMap<String, Integer> >();
		for( String locId : this.locationsList ) {
			HashMap<String, Integer> dirs = new HashMap<>();
			String cwId = (String) this.metro.getJSONObject(locId).getJSONObject("cw").keys().next();
			String ccwId =(String) this.metro.getJSONObject(locId).getJSONObject("ccw").keys().next();

			dirs.put("cw", this.metro.getJSONObject(locId).getJSONObject("cw").getInt( cwId ) );
			dirs.put("ccw", this.metro.getJSONObject(locId).getJSONObject("ccw").getInt( ccwId ) );
			this.metroCost.put( locId, dirs );
		}

		System.out.println("Entered map and ended up at " + this.agentAt );
	}

	public void loop() {
		JSONObject data;
		if( ThreadLocalRandom.current().nextInt(0, 3) == 0 ) {
			String direction = "ccw";
			int cost = this.metroCost.get(this.agentAt).get( direction );
			data = this.sendAction("map/metro", "direction", direction);
			this.agentAt = (String) this.metro.getJSONObject(this.agentAt).getJSONObject( direction ).keys().next();
			System.out.println("[Agent} Taking the metro to " + this.agentAt + " costing " + cost );
		} else {
			String locId = this.locationsList.get( ThreadLocalRandom.current().nextInt(0, this.locationsList.size() - 1) );
			data = this.sendAction("map/bike", "locationId", locId);
			System.out.println("[Agent} Went by bike to " + locId);
			this.agentAt = locId;
		}

	}

	public static void main(String[] args) throws IOException {
		Client c = new Client("http://localhost:3000/api/");
		c.connect( "Coffee Agent" );
		c.enterMap();

		int iterations = 0;
		while( true ) {
			if(iterations % 3 == 0) {
				System.out.print("Press enter to to do three iterations");
				System.in.read();
			}
			c.loop();
			iterations++;
		}
	}
}
