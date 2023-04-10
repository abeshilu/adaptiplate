import './Saved.css';
import { app } from '../index.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import
{
  Container,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import
{
  getAuth,
  onAuthStateChanged
} from "firebase/auth";
import
{
  getDatabase,
  ref,
  get,
  child,
  onValue
} from "firebase/database";

const RecipeCard = ( { recipe, path } ) =>
{
  const handleClick = ( event ) =>
  {
  };

  return (
    <Col md={6}>
      <Link to={`/recipe/${recipe.id}`} onClick={handleClick}>
        <Card id="recipeCard">
          <Card.Img variant="top" src={recipe.image} />
          <Card.ImgOverlay>
            <h4 id="recipeTitle">{recipe.title}</h4>
            <div id="recipeStats">
              <Card.Text>${(recipe.pricePerServing / 100).toFixed(2)}</Card.Text>
              <Card.Text>{recipe.healthScore}</Card.Text>
              <Card.Text>{recipe.readyInMinutes} mins</Card.Text>
            </div>
          </Card.ImgOverlay>
        </Card>
      </Link>
    </Col>
  );
};

function Saved ()
{
  // Initialize Firebase Authentication and get a reference to the service
  const auth = getAuth( app );
  // const user = auth.currentUser;

  const [loggedIn, setLoggedIn] = useState(false);

  const [userData, setUserData] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect( () =>
  {
    onAuthStateChanged(auth, (currentUser) => {
      setSavedRecipes([]);
      if (currentUser) {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `users/${currentUser.uid}`)).then((snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          }
        }).catch((error) => {
          console.error(error);
          alert("Error retrieving user data.");
        });

        getSavedRecipes();
      }
      setLoggedIn(currentUser != null);
    });
  }, [] );

  function getSavedRecipes() {
    const dbRef = ref(getDatabase());
    const db = getDatabase();
    const dbSavedRecipesRef = ref(db, `users/${auth.currentUser.uid}/recipes`);
    onValue(dbSavedRecipesRef, (snapshot) => {
      let recipeIds = [];
      snapshot.forEach((recipeIdSnapshot) => {
        const recipeId = recipeIdSnapshot.val();
        recipeIds.push(recipeId);
      });
      recipeIds.forEach((id) => {
        get(child(dbRef, `recipes/${id.id}`)).then((recipeSnapshot) => {
          if (recipeSnapshot.exists()) {
            setSavedRecipes(oldArray => [...oldArray, recipeSnapshot.val()]);
          }
        }).catch((error) => {
          console.error(error);
          alert("Error retrieving recipe data.");
        });
      });
    }, {
      onlyOnce: false
    });
  }

  return (
    <Container>
      {loggedIn ? (
        <div>
          <h1 id="titleText">Saved Recipes</h1>
          <div>
            <Row>
              {savedRecipes.map( ( recipe ) => (
                <RecipeCard recipe={recipe} />
              ) )}
            </Row>
          </div>
        </div>
      ) : (
        <div>
          <Link to="/login">
            <button id="loginButton">Login</button>
          </Link>
        </div>
      )}
    </Container>
  );
}

export default Saved;
