import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Form,
  InputGroup,
  Button,
  DropdownButton,
  Dropdown
} from 'react-bootstrap';
import { app, api, apiKey, apiHost } from '../index.js';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  getDatabase,
  ref,
  set,
  child,
  get,
  update,
} from "firebase/database";

import {
  getAuth,
} from "firebase/auth";

function parseId(source, title) {
  return source.replace(/ /g, "-").toLowerCase().split(".")[0] + "-" + title.replace(/ /g, "-").toLowerCase();
}

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const onRecipeCardClick = (e) => {
    e.preventDefault();
    setLoading(true);
    axios.get(`${api}/recipes/${recipe.id}/information`, {
      params: {
        includeNutrition: true,
      },
      headers: {
        'x-api-key': apiKey,
        //'X-RapidAPI-Key': apiKey,
        //'X-RapidAPI-Host': apiHost
      }
    })
      .then((response) => {
        const dbRef = ref(getDatabase());
        const newId = parseId(response.data.sourceName, response.data.title);
        const newRecipeRef = child(dbRef, `recipes/${newId}`);
        response.data.id = newId;


        const auth = getAuth(app);
        if (auth.currentUser) {
          const userRef = child(dbRef, `users/${auth.currentUser.uid}`);
          get(userRef).then((snapshot) => {
            const userData = snapshot.val();
            const recentlyViewed = userData.recentlyViewed || [];
            if (recentlyViewed[0] !== newId) {
              const newRecentlyViewed = [newId, ...recentlyViewed].slice(0, 3);
              update(userRef, { recentlyViewed: newRecentlyViewed });
            }
          }).catch((error) => {
            alert("Error updating user data. Please try again!");
            console.error(error);
          });
        }

        set(newRecipeRef, response.data).then(() => {
          setLoading(false);
          navigate(`/recipe/${newId}`);
        }).catch((error) => {
          setLoading(false);
          alert("Error retrieving recipe. Please try again!");
          console.error(error);
        });
      })
      .catch((error) => {
        setLoading(false);
        alert("Error retrieving recipe. Please try again!");
        console.error(error);
      })
      .then(() => {

      });
  };

  return (
    <Col md={6}>
      {loading ? (
        <div id="loadingScreen">
          <Spinner id="loadingSpinner" variant="light" animation="border" />
        </div>
      ) : (<span />)}

      <Card id="recipeCard" onClick={onRecipeCardClick}>
        <Card.Img variant="top" src={recipe.image} />
        <Card.ImgOverlay>
          <h4 id="recipeTitle">{recipe.title}</h4>
        </Card.ImgOverlay>
      </Card>
    </Col>
  );
};

function Search() {
  const location = useLocation();
  const [currentSearch, setCurrentSearch] = useState(location.state.currentSearch);
  const recipes = location.state.recipes;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const handleFilter = async (filter) => {
    setFilter(filter);
  };

  const handleNewSearch = async (optionalFilter = filter, event) => {
    event.preventDefault();
    setLoading(true);
    const input = document.querySelector('input[name="searchInput"]').value;
    const regex = /^(http|https):\/\/([\w\d]+\.)+[\w\d]{2,}(\/.*)?$/;
    if (regex.test(input)) {
      // URL input
      axios.get(`${api}/recipes/extract`, {
        params: {
          url: input,
          analyze: true,
          includeNutrition: true,
        },
        headers: {
          'x-api-key': apiKey,
          //'X-RapidAPI-Key': apiKey,
          //'X-RapidAPI-Host': apiHost
        }
      })
        .then((response) => {
          const dbRef = ref(getDatabase());
          const newId = parseId(response.data.sourceName, response.data.title);
          const newRecipeRef = child(dbRef, `recipes/${newId}`);
          response.data.id = newId;

          const auth = getAuth(app);
          if (auth.currentUser) {
            const userRef = child(dbRef, `users/${auth.currentUser.uid}`);
            get(userRef).then((snapshot) => {
              const userData = snapshot.val();
              const recentlyViewed = userData.recentlyViewed || [];
              if (recentlyViewed[0] !== newId) {
                const newRecentlyViewed = [newId, ...recentlyViewed].slice(0, 3);
                update(userRef, { recentlyViewed: newRecentlyViewed });
              }
            }).catch((error) => {
              alert("Error updating user data. Please try again!");
              console.error(error);
            });
          }

          set(newRecipeRef, response.data).then(() => {
            setLoading(false);
            navigate(`/recipe/${newId}`);
          }).catch((error) => {
            setLoading(false);
            alert("Error retrieving recipe. Please try again!");
            console.error(error);
          });
        })
        .catch((error) => {
          setLoading(false);
          alert("Error retrieving recipe. Please try again!");
          console.error(error);
        })
        .then(() => {

        });
    } else {
      // Search input
      axios.get(`${api}/recipes/complexSearch`, {
        params: {
          query: input,
          sort: "popularity",
          number: 30,
          diet: optionalFilter,
        },
        headers: {
          'x-api-key': apiKey,
          //'X-RapidAPI-Key': apiKey,
          //'X-RapidAPI-Host': apiHost
        }
      })
        .then((response) => {
          setLoading(false);
          navigate('/Search', { state: { recipes: response.data, currentSearch: input } });
        })
        .catch((error) => {
          setLoading(false);
          alert("Error retrieving recipes. Please try again!");
          console.error(error);
        })
        .then(() => {

        });
    }
  };

  return (
    <Container>
      {loading ? (
        <div id="loadingScreen">
          <Spinner id="loadingSpinner" variant="light" animation="border" />
        </div>
      ) : (<span />)}
      <h1 id="titleText">Search Results</h1>
      <Form>
        <InputGroup>
          <Form.Control type="text" name="searchInput" value={currentSearch} onChange={(event) => setCurrentSearch(event.target.value)} />
          <Button variant="outline-secondary" id="searchBtn" type="submit" onClick={handleNewSearch}>
            {<span className="material-symbols-outlined">
              search
            </span>}
            {/* <Link to={dst} id="searchLink" className="material-symbols-outlined">
              search
            </Link> */}
          </Button>
          <DropdownButton variant="outline-secondary" id="filterBtn" title={<span className="material-symbols-outlined">filter_list</span>}>
            <Dropdown.Item onClick={() => handleNewSearch("Vegetarian")} className={filter === "Vegetarian" ? "selected-filter" : ""}>
              Vegetarian
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNewSearch("Vegan")} className={filter === "Vegan" ? "selected-filter" : ""}>
              Vegan
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNewSearch("Gluten Free")} className={filter === "Gluten Free" ? "selected-filter" : ""}>
              Gluten Free
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNewSearch("Low FODMAP")} className={filter === "Low FODMAP" ? "selected-filter" : ""}>
              Low FODMAP
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNewSearch("Pescatarian")} className={filter === "Pescatarian" ? "selected-filter" : ""}>
              Pescatarian
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNewSearch("Paleo")} className={filter === "Paleo" ? "selected-filter" : ""}>
              Paleo
            </Dropdown.Item>
            {/* <Dropdown.Item onClick={() => handleNewSearch( "" )}>
              Remove Diet Filter
            </Dropdown.Item> */}
          </DropdownButton>
        </InputGroup>
      </Form>
      <Row>
        {recipes.results.map((recipe) => (
          <RecipeCard recipe={recipe} />
        ))}
      </Row>
    </Container>
  );
}

export default Search;