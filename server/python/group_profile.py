def get_group_profile(group_data):
    cuisine_votes = {}
    budget_votes = {}
    latitudes = []
    longitudes = []

    for member in group_data:
        for cuisine in member["cuisines"]:
            cuisine_votes[cuisine] = cuisine_votes.get(cuisine, 0) + 1
        budget = member["budget"]
        budget_votes[budget] = budget_votes.get(budget, 0) + 1
        latitudes.append(member["location"][0])
        longitudes.append(member["location"][1])

    top_cuisines = sorted(cuisine_votes, key=cuisine_votes.get, reverse=True)[:3]
    top_budget = max(budget_votes, key=budget_votes.get)
    centroid = [sum(latitudes)/len(latitudes), sum(longitudes)/len(longitudes)]

    return top_cuisines, top_budget, centroid