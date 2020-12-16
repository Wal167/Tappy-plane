/*
 * GDevelop Core
 * Copyright 2008-2016 Florian Rival (Florian.Rival@gmail.com). All rights
 * reserved. This project is released under the MIT License.
 */

#ifndef GDCORE_VARIABLE_H
#define GDCORE_VARIABLE_H
#include <map>
#include <memory>
#include <vector>

#include "GDCore/String.h"
namespace gd {
class SerializerElement;
}
class TiXmlElement;

namespace gd {

/**
 * \brief Defines a variable which can be used by an object, a layout or a
 * project.
 *
 * \see gd::VariablesContainer
 *
 * \ingroup PlatformDefinition
 */
class GD_CORE_API Variable {
 public:
  enum class Type : char {
    // Primitive types
    String = 't',
    Number = 'n',
    Boolean = 'b',

    // Structural types
    Structure = 's',
    Array = 'a'
  };

  /**
   * \brief Default constructor creating a variable with 0 as value.
   */
  Variable() : value(0), type(Type::Number){};
  Variable(const Variable&);
  virtual ~Variable(){};

  Variable& operator=(const Variable& rhs);

  /**
   * \brief Get the type of the variable.
   */
  Type GetType() const { return type; }

  /** \name Primitives
   * Methods and operators used when the variable is considered as a primitive.
   */
  ///@{

  /**
   * \brief Return the content of the variable, considered as a string.
   */
  const gd::String& GetString() const;

  /**
   * \brief Change the content of the variable, considered as a string.
   */
  void SetString(const gd::String& newStr) {
    str = newStr;
    type = Type::String;
  }

  /**
   * \brief Return the content of the variable, considered as a number.
   */
  double GetValue() const;

  /**
   * \brief Change the content of the variable, considered as a number.
   */
  void SetValue(double val) {
    value = val;
    type = Type::Number;
  }

  /**
   * \brief Return the content of the variable, considered as a number.
   */
  bool GetBool() const;

  /**
   * \brief Change the content of the variable, considered as a number.
   */
  void SetBool(bool val) {
    boolVal = val;
    type = Type::Boolean;
  }

  // Operators are overloaded to allow accessing to variable using a simple
  // int-like semantic.
  void operator=(double val) { SetValue(val); };
  void operator+=(double val) { SetValue(val + GetValue()); }
  void operator-=(double val) { SetValue(GetValue() - val); }
  void operator*=(double val) { SetValue(val * GetValue()); }
  void operator/=(double val) { SetValue(GetValue() / val); }

  bool operator<=(double val) const { return GetValue() <= val; };
  bool operator>=(double val) const { return GetValue() >= val; };
  bool operator<(double val) const { return GetValue() < val; };
  bool operator>(double val) const { return GetValue() > val; };
  bool operator==(double val) const { return GetValue() == val; };
  bool operator!=(double val) const { return GetValue() != val; };

  // Operators are overloaded to allow accessing to variable using a simple
  // string-like semantic.
  void operator=(const gd::String& val) { SetString(val); };
  void operator+=(const gd::String& val) { SetString(GetString() + val); }

  bool operator==(const gd::String& val) const { return GetString() == val; };
  bool operator!=(const gd::String& val) const { return GetString() != val; };

  // Operators are overloaded to allow accessing to variable using a simple
  // bool-like semantic.
  void operator=(const bool val) { SetBool(val); };

  bool operator==(const bool val) const { return GetBool() == val; };
  bool operator!=(const bool val) const { return GetBool() != val; };

  ///@}

  /** \name Structural types
   * Methods used for structural types
   */
  ///@{

  /**
   * \brief Remove all the children.
   */
  void ClearChildren() {
    children.clear();
    childrenList.clear();
  };

  /**
   * \brief Get the count of children that the variable has.
   */
  size_t GetChildrenCount() const {
    return type == Type::Structure
               ? children.size()
               : type == Type::Array ? childrenList.size() : 0;
  };

  /** \name Structure
   * Methods used when the variable is considered as a structure.
   */
  ///@{
  /**
   * \brief Return true if the variable is a structure and has the specified
   * child.
   */
  bool HasChild(const gd::String& name) const;

  /**
   * \brief Return the child with the specified name.
   *
   * If the variable has not the specified child, an empty variable with the
   * specified name is added as child.
   */
  Variable& GetChild(const gd::String& name);

  /**
   * \brief Return the child with the specified name.
   *
   * If the variable has not the specified child, an empty variable with the
   * specified name is added as child.
   */
  const Variable& GetChild(const gd::String& name) const;

  /**
   * \brief Remove the child with the specified name.
   *
   * If the variable is not a structure or has not
   * the specified child, nothing is done.
   */
  void RemoveChild(const gd::String& name);

  /**
   * \brief Rename the specified child.
   *
   * If the variable is not a structure or has not
   * the specified child, nothing is done.
   * \return true if the child was renamed, false otherwise.
   */
  bool RenameChild(const gd::String& oldName, const gd::String& newName);

  /**
   * \brief Get the names of all children
   */
  std::vector<gd::String> GetAllChildrenNames() const;

  /**
   * \brief Get the map containing all the children.
   */
  const std::map<gd::String, std::shared_ptr<Variable>>& GetAllChildren()
      const {
    return children;
  }

  /**
   * \brief Search if a variable is part of the children, optionally recursively
   */
  bool Contains(const gd::Variable& variableToSearch, bool recursive) const;

  /**
   * \brief Remove the specified variable if it can be found in the children
   */
  void RemoveRecursively(const gd::Variable& variableToRemove);
  ///@}

  /** \name Array
   * Methods used when the variable is considered as an array.
   */
  ///@{

  /**
   * \brief Return the element with the specified index.
   *
   * If the variable does not have the specified index,
   * the array will be filled up to that index with empty variables.
   */
  Variable& GetAtIndex(const size_t index);

  /**
   * \brief Return the element with the specified index.
   *
   * If the variable has not the specified child,
   * an empty variable is returned.
   */
  const Variable& GetAtIndex(const size_t index) const;

  /**
   * \brief Remove the element with the specified index.
   *
   * And shifts all the next elements back by one.
   */
  void RemoveAtIndex(const size_t index);

  /**
   * \brief Get the vector containing all the children.
   */
  const std::vector<std::shared_ptr<Variable>>& GetAllChildrenList() const {
    return childrenList;
  }
  ///@}
  ///@}

  /** \name Serialization
   * Methods used when to load or save a variable to XML.
   */
  ///@{
  /**
   * \brief Serialize variable.
   */
  void SerializeTo(SerializerElement& element) const;

  /**
   * \brief Unserialize the variable.
   */
  void UnserializeFrom(const SerializerElement& element);
  ///@}

 private:
  mutable Type type;
  mutable gd::String str;
  mutable double value;
  mutable bool boolVal;
  mutable std::map<gd::String, std::shared_ptr<Variable>>
      children;  ///< Children, when the variable is considered as a structure.
  mutable std::vector<std::shared_ptr<Variable>>
      childrenList;  ///< Children, when the variable is considered as an array.

  /**
   * Initialize children by copying them from another variable.  Used by
   * copy-ctor and assign-op.
   */
  void CopyChildren(const Variable& other);
};

}  // namespace gd

#endif  // GDCORE_VARIABLE_H
