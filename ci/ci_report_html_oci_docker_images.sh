#!/bin/bash

GIT_REPO="https://github.com/red5pro/red5-truetime-meetings"
# GIT_BRANCH_NAME="epic/AUTO"
# GIT_COMMIT="99c57562341f32c4637488435f776c572f4f695d"
# DOCKER_IMAGE_NAME=red5-truetime-meetings
# DOCKER_IMAGE_TAG=0.0.1.b48
# OCI_COMPARTMENT_ID_ROOT="xxx.xxx.oc1..xxxx"

CURRENT_DIRECTORY=$(pwd)
report_folder="$CURRENT_DIRECTORY/report"
html_file="$CURRENT_DIRECTORY/report/reports.html"

if [[ -d "$report_folder" ]]; then
  if [[ -f "$html_file" ]]; then
    rm $html_file
  fi
else
  mkdir $report_folder
  touch $html_file
fi

{
  echo "<html><head><style>
body {
      background-color: #ffffff;
      font-family: Trebuchet MS, Arial, Helvetica, sans-serif;}
h1   {
      font-family: Trebuchet MS, Arial, Helvetica, sans-serif;
      color: #3b6d6b;}
h3   {
      font-family: Trebuchet MS, Arial, Helvetica, sans-serif;
      color: #3b6d6b;}

#customers {
  font-family: Trebuchet MS, Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  text-align: center;
  width: 100%;
}
#customers th {
  border: 1px solid #ddd;
  padding: 1px;
}
#customers td {
  border: 1px solid #3b6d6b;
  padding: 1px;
}
#customers tr:nth-child(even){background-color: #f2f2f2;}
#customers tr:hover {background-color: #ddd;}
#customers th {
  padding-top: 3px;
  padding-bottom: 3px;
  text-align: center;
  background-color: #3b6d6b;
  color: white;
}
</style></head>"
} >>"$html_file"

{
  echo "<body><center><h1>Truetime meetings</h1></center>"
  echo "<body><center><h2>New Docker image</h2></center>"
  echo "<center><table id=customers>"
  echo "<thead><tr><th></th><th></th></tr></thead>"
  echo "<tr><td>Docker image</td><td>$DOCKER_IMAGE_NAME:$DOCKER_IMAGE_TAG</td></tr>"
  echo "<tr><td>Git branch</td><td><a href="$GIT_REPO/tree/$GIT_BRANCH_NAME">$GIT_BRANCH_NAME</a></td></tr>"
  echo "<tr><td>Git commit</td><td><a href="$GIT_REPO/commit/$GIT_COMMIT">$GIT_COMMIT</a></td></tr>"
  echo "</table>"
} >>"$html_file"

{
  echo "<body><center><h2>All Docker images in OCI Container Registry</h2></center>"
  echo "<center><table id=customers>"
  echo "<thead><tr><th>Created</th><th>Image Name</th><th>Tag</th><th>Git Branch</th><th>Git Commit</th></tr></thead>"
} >>"$html_file"


oci artifacts container image list -c $OCI_COMPARTMENT_ID_ROOT --all --repository-name $DOCKER_IMAGE_NAME | jq -r '.data.items[] | "\(.["display-name"]) \(.["freeform-tags"]["Git_Branch"]) \(.["freeform-tags"]["Git_Commit"]) \(.["time-created"])"' > oci_docker_images.txt

while read -r file_line_image; do
    name=$(echo "$file_line_image" | awk '{print $1}')
    tag=$(echo "$name" | sed 's/[^:]*://')
    branch=$(echo "$file_line_image" | awk '{print $2}')
    commit=$(echo "$file_line_image" | awk '{print $3}')
    time_created=$(echo "$file_line_image" | awk '{print $4}')
    echo "<tr><td>${time_created}</td><td>${name}</td><td>${tag}</td><td><a href="$GIT_REPO/tree/${branch}">${branch}</a></td><td><a href="$GIT_REPO/commit/${commit}">${commit}</a></td></tr>" >>"$html_file"
done < oci_docker_images.txt
echo "</table>" >>"$html_file"

rm oci_docker_images.txt || true
