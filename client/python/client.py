import sys
import json
import random

import requests #obtained using pip or see http://docs.python-requests.org/en/latest/user/install/#install
baseUrl = "http://localhost:3000/api/"
def pretty_json( data ):
	print json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '))

def send_action(endpoint, params = {}, agentToken=None):
	url = baseUrl + endpoint
	try:
		headers = {}
		if agentToken is not None:
			headers = {"agentToken": agentToken}

		r = requests.get(url, headers=headers, params=params)

		print("[Action] %s with params %r giving url: %s"  % ( endpoint, params, r.url ) )
		responseJson = r.json()

		return responseJson
	except requests.exceptions.ConnectionError as e:
		print("[Error] Could not connect to %s with params %r - is the server running?" % (url, params))

def main():
	print("DIS AI python example client on %s" % (baseUrl) )
	raw_input("Press enter to connect and enter map..")
	connectResponse = send_action("environment/connect", params={"name": "Monty"})
	agentToken = connectResponse["agentToken"]

	print( "Received %s as agentToken" % agentToken )
	mapEnterResponse = send_action("map/enter", agentToken=agentToken)

	# Some parsing
	agentAt = mapEnterResponse["state"]["agents"][agentToken]["locationId"]
	locations = mapEnterResponse["state"]["map"]["locations"]
	metroCost = {}
	for locId in locations.keys():
		metroCost[locId] = {}
		metroCost[locId]["cw"] = mapEnterResponse["state"]["map"]["metro"][locId]["cw"]
		metroCost[locId]["ccw"] = mapEnterResponse["state"]["map"]["metro"][locId]["ccw"]

	message = "I start out at %s (key = %s) and have %d locations that I can visit" % (locations[agentAt]["title"], agentAt, len(locations) )
	print( message )
	send_action("environment/agent/say", agentToken=agentToken, params={"message": message })

	while True:
		raw_input("Press enter to run agent loop twice (Ctrl+C to end)")
		visited = [agentAt]
		for i in range(2):
			if random.randint(1,3) == 1:
				direction = random.choice(["cw", "ccw"])
				endsAt, cost = metroCost[agentAt][direction].items()[0]
				agentAt = endsAt
				print("[Agent] Taking the metro to %s costing me %s" % (endsAt, cost) )
				send_action("map/metro", agentToken=agentToken, params={"direction": direction })
			else:
				locId = random.choice(locations.keys())
				print("[Agent] Taking the bike to %s costing me %s" % (locId, 15) )
				send_action("map/bike", agentToken=agentToken, params={"locationId": locId })
				agentAt = locId

			visited.append(agentAt)

		message = "Went from %s to %s - lovely route!" % ( locations[visited[0]]["title"], ', '.join([locations[x]["title"] for x in visited[1:]]))
		print( message )
		send_action("environment/agent/say", agentToken=agentToken, params={"message": message })


if __name__ == '__main__':
   main()
