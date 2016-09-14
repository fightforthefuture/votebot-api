import json
import csv
import sys
import os
from collections import OrderedDict


def convert_google_data_to_json(file):
    # simple script to load Google Civic data from their spreadsheet and convert it to a simpler json format
    # this will break if they change their column ordering, sigh
    # use OrderedDict to maintain insertion order, minimize line-changes on output

    csv_reader = csv.reader(file)
    states = OrderedDict()
    for row in csv_reader:
        state = row[0]
        if not state or state == "State":
            continue

        ovr_link = row[3]
        ovr_link = ovr_link.replace('[Register online](', '')
        if ovr_link.endswith(')'):
            ovr_link = ovr_link.replace(')', '')

        check_registration = row[31]

        deadlines = OrderedDict()
        deadlines['online'] = row[33]
        deadlines['received-by'] = row[34]
        deadlines['mail-by'] = row[35]
        deadlines['in-person'] = row[36]

        requirements = row[32].replace('- ', '').split('\n')

        data = OrderedDict()
        data['Requirements'] = requirements
        data['Deadlines'] = deadlines
        data['CheckRegistration'] = check_registration
        data['RegisterOnline'] = ovr_link
        states[state] = data

    return states


if __name__ == "__main__":
    script = sys.argv[0].split('/')
    if len(script) > 1:
        tools_dir = script[0]
    else:
        tools_dir = '.'

    if len(sys.argv) > 1:
        file_name = sys.argv[1]
    else:
        file_name = "Google Civic Information_ Voter Registration and Voting Requirements Data - Voter Registration Content.csv"

    file_path = os.path.join(tools_dir, file_name)
    if not os.path.exists(file_path):
        print "You need to download the Google Civic document as a CSV"
        print "Last known URL: https://docs.google.com/spreadsheets/d/1iWwgneNFajwDlFx91SLCHUxUJOSO7lR0G5zUWFK0YY4/export?format=csv"

    data = convert_google_data_to_json(open(file_path, 'r'))
    content = """/* THIS IS AN AUTOMATICALLY GENERATED FILE. DO NOT EDIT MANUALLY */
exports.registration_requirements = %s;""" % json.dumps(data, indent=2, separators=(',', ': '))
    outfile = open('lib/google_civic.js', 'w')
    outfile.write(content)
    outfile.close()
