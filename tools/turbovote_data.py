import json
import csv
import sys
import os
from datetime import datetime
from collections import OrderedDict


def convert_turbovote_to_json(file):
    # simple script to load TurboVote data from their spreadsheet and convert it to a simpler json format
    # this will break if they change their column ordering, sigh
    # use OrderedDict to maintain insertion order, minimize line-changes on output

    csv_reader = csv.reader(file)
    states = OrderedDict()
    for row in csv_reader:
        state = row[0]
        if not state or state == "State":
            continue

        # expand abbreviations
        period_abbr = row[1]
        if period_abbr == 'EV':
            period_kind = 'early-voting'
        elif period_abbr == 'AIP':
            period_kind = 'absentee-in-person'
        elif 'DB' in period_abbr:
            period_kind = 'vote-by-mail'
        else:
            period_kind = ''

        # normalize dates to iso format
        if row[4]:
            date_start = datetime.strptime(row[4], '%m/%d/%y')
            date_start_iso = date_start.strftime('%Y-%m-%d')
        else:
            date_start_iso = ''

        data = OrderedDict()
        data['Type'] = period_kind
        data['StartDate'] = date_start_iso
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
        file_name = "turbovote-early-voting.csv"

    file_path = os.path.join(tools_dir, file_name)
    if not os.path.exists(file_path):
        print "You need to download the TurboVote document as a CSV"
        
    data = convert_turbovote_to_json(open(file_path, 'r'))
    content = """/* THIS IS AN AUTOMATICALLY GENERATED FILE. DO NOT EDIT MANUALLY */
exports.early_voting_periods = %s;""" % json.dumps(data, indent=2, separators=(',', ': '))
    outfile = open('lib/turbovote.js', 'w')
    outfile.write(content)
    outfile.close()
